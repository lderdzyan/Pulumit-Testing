import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
import * as fs from "fs";

const bucketName = process.env.BUCKET_NAME

const MyBucket = new aws.s3.Bucket("myBucket", {
    bucket: bucketName
});

const appsDir = "../apps";
const apps = fs.readdirSync(appsDir).filter(f =>
    fs.statSync(path.join(appsDir, f)).isDirectory()
);

for (const appName of apps) {
    const appPath = path.join(appsDir, appName);

    new aws.s3.BucketObject(`${appName}-files`, {
        bucket: MyBucket.id,
        source: new pulumi.asset.FileArchive(appPath),
    });
}
const MyOac = new aws.cloudfront.OriginAccessControl("myoac", {
    name: "pulumioac1",
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
});
const myDistribution = new aws.cloudfront.Distribution("myDistribution", {
    origins: [{
        domainName: MyBucket.bucketRegionalDomainName,
        originAccessControlId: MyOac.id,
        originId: "myS3Origin", 
    }],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: "myS3Origin",
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        },
        viewerProtocolPolicy: "redirect-to-https",
    },
    restrictions: {
        geoRestriction: { restrictionType: "none" }
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
});

new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: MyBucket.id,
    policy: pulumi.all([MyBucket.arn, myDistribution.arn]).apply(([bucketArn, distArn]) => 
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Sid: "AllowCloudFrontServicePrincipalReadOnly",
                Effect: "Allow",
                Principal: { Service: "cloudfront.amazonaws.com" },
                Action: "s3:GetObject",
                Resource: `${bucketArn}/*`,
                Condition: {
                    StringEquals: { "AWS:SourceArn": distArn }
                }
            }]
        })
    ),
});

export const websiteUrl = pulumi.interpolate`https://${myDistribution.domainName}`;