import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as synced from "@pulumi/synced-folder";
import { local } from "@pulumi/command";

const config = new pulumi.Config();
const s3OriginBucket = config.get("cloudfront_s3_bucket");
// const certificateArn = config.get("certificate_arn");
// const domainZone = config.get("domain_zone");
// const domain = config.get("domain");
const frontendS3OriginId = "poc-frontend-origin";

export function deployFrontend() {
//   if (domain == null) {
//     console.log("Domain is required");
//     return;
//   }
  const originBucket = new aws.s3.Bucket("s3-bucket", {
    bucket: s3OriginBucket,
  });

  const s3Oac = new aws.cloudfront.OriginAccessControl("s3-oac", {
    name: "pulumioac20",
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  });

  const indexFunction = new aws.cloudfront.Function("poc-index-function", {
    name: "poc-index-function",
    runtime: "cloudfront-js-2.0",
    publish: true,
    code: `
        function handler(event) {
          var request = event.request;

          if (request.uri.endsWith('/')) {
            request.uri += 'index.html';
          }

          return request;
        }
      `,
  });

  const disableCacheForIndexAndBootstrap = new aws.cloudfront.Function("poc-disable-cache", {
    name: "poc-disable-cache",
    runtime: "cloudfront-js-2.0",
    publish: true,
    code: `
      function handler(event) {
        var response = event.response;
        var request = event.request;
        var headers = response.headers;

        var uri = request.uri;

        if (uri.endsWith(".html") || uri.endsWith("/") || uri.endsWith("bootstrap.js")) {
          headers["cache-control"] = {
            value: "no-cache, no-store, must-revalidate"
          };
        }

        return response;
      }
      `,
  });

 

//   const getDomainZone = aws.route53.getZone({ name: domainZone });
//   new aws.route53.Record("poc-record", {
//     zoneId: getDomainZone.then(zone => zone.id),
//     name: domain,
//     type: aws.route53.RecordType.A,
//     aliases: [{
//       zoneId: s3Distribution.hostedZoneId,
//       name: s3Distribution.domainName,
//       evaluateTargetHealth: false,
//     }],
//   });

  const appsSync = new synced.S3BucketFolder("apps", {
    path: "../apps",
    bucketName: originBucket.bucket,
    acl: "private",
  });
 const s3Distribution = new aws.cloudfront.Distribution("poc-distribution", {
    origins: [{
      domainName: originBucket.bucketRegionalDomainName,
      originAccessControlId: s3Oac.id,
      originId: frontendS3OriginId,
      originPath: "/apps"
    }],
    comment: "msinfraops-poc-frontend",
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: frontendS3OriginId,
      viewerProtocolPolicy: "redirect-to-https",
      forwardedValues: { queryString: false, cookies: { forward: "none" } },
      minTtl: 0,
      defaultTtl: 86400,
      maxTtl: 31536000,
      compress: true,
      functionAssociations: [{
        eventType: "viewer-request",
        functionArn: indexFunction.arn,
      }, {
        eventType: "viewer-response",
        functionArn: disableCacheForIndexAndBootstrap.arn,
      }],
    },
    priceClass: "PriceClass_200",
    restrictions: {
      geoRestriction: { restrictionType: "none" }
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    }
    // aliases: [`${domain}.${domainZone}`],
  });

  const originBucketPolicy = aws.iam.getPolicyDocumentOutput({
    statements: [{
      sid: "AllowCloudFrontServicePrincipalReadWrite",
      effect: "Allow",
      principals: [{
        type: "Service",
        identifiers: ["cloudfront.amazonaws.com"],
      }],
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [pulumi.interpolate`${originBucket.arn}/*`],
      conditions: [{
        test: "StringEquals",
        variable: "AWS:SourceArn",
        values: [s3Distribution.arn],
      }],
    }],
  });

  new aws.s3.BucketPolicy("s3-bucket-policy", {
    bucket: originBucket.bucket,
    policy: originBucketPolicy.apply(originBucketPolicy => originBucketPolicy.json),
  });

  const runId = pulumi.output(new Date().toISOString());
  new local.Command("cf-invalidate", {
    triggers: [runId],
    create: pulumi.interpolate`aws cloudfront create-invalidation --distribution-id ${s3Distribution.id} --paths "/*"`,
  }, {
    dependsOn: [s3Distribution, appsSync],
  });
}

