const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } = require('@aws-sdk/client-s3');
const { CloudFormationClient, DeleteStackCommand, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');

const region = 'us-east-1';
const s3 = new S3Client({ region });
const cf = new CloudFormationClient({ region });

async function emptyAndDeleteBucket(bucketName) {
  try {
    console.log(`Checking bucket: ${bucketName}`);
    let isTruncated = true;
    let continuationToken;

    while (isTruncated) {
      const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken }));
      if (listRes.Contents && listRes.Contents.length > 0) {
        console.log(`Deleting ${listRes.Contents.length} objects from ${bucketName}...`);
        await s3.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: listRes.Contents.map(obj => ({ Key: obj.Key })) }
        }));
      }
      isTruncated = listRes.IsTruncated;
      continuationToken = listRes.NextContinuationToken;
    }
    
    console.log(`Deleting bucket: ${bucketName}`);
    await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket ${bucketName} deleted.`);
  } catch (err) {
    console.error(`❌ Failed to delete bucket ${bucketName}: ${err.message}`);
  }
}

async function deleteStack(stackName) {
  try {
    console.log(`Initiating deletion for stack: ${stackName}`);
    await cf.send(new DeleteStackCommand({ StackName: stackName }));
    console.log(`✅ Deletion initiated for ${stackName}. Check AWS Console for progress.`);
  } catch (err) {
    console.error(`❌ Failed to initiate deletion for ${stackName}: ${err.message}`);
  }
}

async function runCleanup() {
  const buckets = ["amplify-agrofproject-dark-agrofuploadsbucketbf5869-gqq9wibuzacu"];
  const stacks = [
    "amplify-agrofproject-darksagae-sandbox-e9845f0c1f-storage0EC3F24A-1QLV582N2STPC",
    "amplify-agrofproject-darksagae-sandbox-e9845f0c1f-auth179371D7-LXW83GR5IJLI",
    "amplify-agrofproject-darksagae-sandbox-e9845f0c1f"
  ];

  for (const bucket of buckets) {
    await emptyAndDeleteBucket(bucket);
  }

  for (const stack of stacks) {
    await deleteStack(stack);
  }
}

runCleanup();
