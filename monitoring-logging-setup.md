# Monitoring and Logging Setup Guide

## 📊 Production Monitoring and Logging for AGROF Platform

### Phase 1: Coolify Built-in Monitoring

#### Enable Coolify Monitoring
1. **Access Coolify Dashboard**: `http://10.0.0.1:8000`
2. **Go to**: Projects → [Your Project] → Monitoring
3. **Enable**:
   - ✅ **Health Checks**
   - ✅ **Performance Monitoring**
   - ✅ **Resource Usage**
   - ✅ **Log Aggregation**

#### Configure Health Checks
```yaml
# Health check configuration
health_checks:
  api_service:
    endpoint: "/health"
    interval: 30s
    timeout: 10s
    retries: 3
  
  store_service:
    endpoint: "/api/products"
    interval: 60s
    timeout: 15s
    retries: 2
  
  database:
    type: "postgres"
    connection_check: true
    interval: 30s
```

### Phase 2: Application Logging

#### API Service Logging
```python
# agrof-main/src/api/logging_config.py
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Create file handler
        file_handler = logging.FileHandler('/app/logs/api.log')
        file_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
    
    def log_request(self, method, endpoint, status_code, response_time):
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "response_time_ms": response_time,
            "service": "agrof-api"
        }
        self.logger.info(json.dumps(log_data))
    
    def log_error(self, error, context=None):
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "error": str(error),
            "context": context,
            "service": "agrof-api"
        }
        self.logger.error(json.dumps(log_data))

# Usage in app.py
logger = StructuredLogger(__name__)

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    start_time = time.time()
    try:
        # Your existing code
        result = analyze_plant_disease_with_gemini(image_file)
        
        response_time = (time.time() - start_time) * 1000
        logger.log_request('POST', '/api/analyze', 200, response_time)
        
        return jsonify(result)
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        logger.log_request('POST', '/api/analyze', 500, response_time)
        logger.log_error(e, {"endpoint": "/api/analyze"})
        raise
```

#### Store Service Logging
```javascript
// store-backend/logging.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logDir = path.join(__dirname, 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      service: this.serviceName,
      message: message,
      data: data
    };

    // Write to file
    const logFile = path.join(this.logDir, `${level}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    // Also log to console
    console.log(`[${level.toUpperCase()}] ${message}`, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }
}

module.exports = new Logger('agrof-store');
```

### Phase 3: Database Monitoring

#### PostgreSQL Monitoring
```sql
-- Create monitoring user
CREATE USER monitoring_user WITH PASSWORD 'monitoring2024';
GRANT pg_monitor TO monitoring_user;

-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries > 1s
SELECT pg_reload_conf();
```

#### Database Health Check Script
```bash
#!/bin/bash
# scripts/db-health-check.sh

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="agrof_db"
DB_USER="agrof_user"

# Check database connectivity
pg_isready -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER

if [ $? -eq 0 ]; then
    echo "Database is healthy"
    
    # Check table sizes
    psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
else
    echo "Database is unhealthy"
    exit 1
fi
```

### Phase 4: System Monitoring

#### System Metrics Collection
```bash
#!/bin/bash
# scripts/system-monitoring.sh

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory Usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1)

# Docker Container Status
DOCKER_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(agrof|coolify)")

# Log metrics
echo "$(date): CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%" >> /var/log/system-metrics.log

# Alert if thresholds exceeded
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "ALERT: High CPU usage: ${CPU_USAGE}%"
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "ALERT: High memory usage: ${MEMORY_USAGE}%"
fi

if (( $(echo "$DISK_USAGE > 90" | bc -l) )); then
    echo "ALERT: High disk usage: ${DISK_USAGE}%"
fi
```

### Phase 5: Log Aggregation with ELK Stack

#### Docker Compose for ELK
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    container_name: logstash
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - /var/log:/var/log:ro
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

#### Logstash Configuration
```ruby
# logstash.conf
input {
  file {
    path => "/var/log/*.log"
    type => "system"
  }
  file {
    path => "/app/logs/*.log"
    type => "application"
  }
}

filter {
  if [type] == "application" {
    json {
      source => "message"
    }
  }
  
  if [type] == "system" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "agrof-logs-%{+YYYY.MM.dd}"
  }
}
```

### Phase 6: Alerting Setup

#### Email Alerts
```python
# scripts/alerting.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

class AlertManager:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email = "your-email@gmail.com"
        self.password = "your-app-password"
        
    def send_alert(self, subject, message, severity="WARNING"):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email
            msg['To'] = self.email
            msg['Subject'] = f"[AGROF] {severity}: {subject}"
            
            body = f"""
            Alert Details:
            Severity: {severity}
            Subject: {subject}
            Message: {message}
            Timestamp: {datetime.now().isoformat()}
            
            Please check your AGROF platform immediately.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email, self.password)
            text = msg.as_string()
            server.sendmail(self.email, self.email, text)
            server.quit()
            
            logging.info(f"Alert sent: {subject}")
        except Exception as e:
            logging.error(f"Failed to send alert: {e}")

# Usage
alert_manager = AlertManager()
alert_manager.send_alert("High CPU Usage", "CPU usage is above 80%", "CRITICAL")
```

### Phase 7: Dashboard Setup

#### Grafana Dashboard
```yaml
# docker-compose.grafana.yml
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  grafana_data:
```

### Phase 8: Automated Monitoring Script

#### Complete Monitoring Script
```bash
#!/bin/bash
# scripts/complete-monitoring.sh

# Configuration
LOG_FILE="/var/log/agrof-monitoring.log"
ALERT_EMAIL="admin@agrof.com"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=90

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    
    if curl -f -s $health_url > /dev/null; then
        log_message "HEALTHY: $service_name is running"
        return 0
    else
        log_message "UNHEALTHY: $service_name is down"
        return 1
    fi
}

# Main monitoring logic
log_message "Starting AGROF platform monitoring"

# Check API service
check_service "API" "http://localhost:5000/health"

# Check Store service
check_service "Store" "http://localhost:3000/api/products"

# Check Database
pg_isready -h localhost -p 5432 -d agrof_db -U agrof_user
if [ $? -eq 0 ]; then
    log_message "HEALTHY: Database is accessible"
else
    log_message "UNHEALTHY: Database is not accessible"
fi

# Check system resources
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1)

log_message "SYSTEM: CPU ${CPU_USAGE}%, Memory ${MEMORY_USAGE}%, Disk ${DISK_USAGE}%"

# Send alerts if needed
if (( $(echo "$CPU_USAGE > $THRESHOLD_CPU" | bc -l) )); then
    echo "ALERT: High CPU usage detected" | mail -s "AGROF Alert" $ALERT_EMAIL
fi

log_message "Monitoring check completed"
```

## 🎯 Implementation Checklist

- [ ] Enable Coolify monitoring
- [ ] Configure application logging
- [ ] Set up database monitoring
- [ ] Implement system metrics collection
- [ ] Configure log aggregation (optional)
- [ ] Set up alerting system
- [ ] Create monitoring dashboard
- [ ] Test all monitoring components

## 📊 Monitoring Endpoints

After setup, access:
- **Coolify Dashboard**: `http://10.0.0.1:8000`
- **Grafana**: `http://10.0.0.1:3001` (admin/admin123)
- **Kibana**: `http://10.0.0.1:5601` (if ELK stack deployed)

---

**Ready to implement monitoring!** Choose the components you need and follow the setup steps.
