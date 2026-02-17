import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const MyBucket = new aws.s3.Bucket("myBucket", {
    bucket: "pulumibacket1-unique",
});

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