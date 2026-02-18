import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const dir = process.env.DIR_NAME;
const envName = process.env.ENV_NAME;
const appName = process.env.APP_NAME;
const bucketName = process.env.BUCKET_NAME||"";

const bucket = aws.s3.Bucket.get("my-bucket", bucketName );

new aws.s3.BucketObject("example", {
    bucket: bucket.id,
    key: `${dir}/${envName}/${appName}/`,  
    source: new pulumi.asset.StringAsset("")
});