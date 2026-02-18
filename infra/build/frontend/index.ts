import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";

const env = process.env.ENV_NAME;
const appName = process.env.APP_NAME;

const myBucket = new aws.s3.Bucket("my-bucket", {
    bucket: "pulumi-test-archive",
    objectLockEnabled: true,
});

new aws.s3.BucketObject("save-app-zip", {
    bucket: myBucket.id,
    source: new pulumi.asset.FileAsset(
        path.resolve(`../../../code/frontend/app/${appName}/build/${appName}.zip`)
    ),
    key: `frontend/${env}/${appName}`,
    forceDestroy: true,
});