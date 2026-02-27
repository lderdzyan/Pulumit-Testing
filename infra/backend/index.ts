import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { LambdaFunctions, LambdaFunctionType } from "./lambda";
import createServerLambda from "./server-lambda";
import createPublishLambda from "./publish-lambda";

interface APIGateway {
  name: string;
  stage: string;
}
const config = new pulumi.Config();
// const certificateArn = config.get("certificate_arn");
// const domainZone = config.get("domain_zone");
// const domain = config.get("domain");
const apiGatewayConfig = config.getObject<APIGateway>("api-gateway");
const lambdaFunctions = config.getObject<LambdaFunctions[]>("lambda-functions");
const environment = config.get("environment");

function validateConfig(): boolean {
//   if (certificateArn == null) {
//     console.log("certificate_arn is required.");
//     return false;
//   }
//   if (domain == null) {
//     console.log("domain is required.");
//     return false;
//   }
//   if (domainZone == null) {
//     console.log("domain_zone is required.");
//     return false;
//   }
  if (apiGatewayConfig?.name == null || apiGatewayConfig?.stage == null) {
    console.log("api-gateway is required.");
    return false;
  }

  return true;
}

export function deployBackend() {
  if (!validateConfig()) return;

//   const domainZoneOutput = aws.route53.getZoneOutput({ name: domainZone });

  const httpApi = new aws.apigatewayv2.Api("poc-http-api", {
    name: apiGatewayConfig!.name,
    protocolType: "HTTP",
    corsConfiguration: {
      allowOrigins: ["*"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      allowHeaders: ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"],
      exposeHeaders: [],
      maxAge: 86400,
    },
  });

  if (lambdaFunctions != null) {
    for (const lambda of lambdaFunctions) {
      switch (lambda.type) {
        case LambdaFunctionType.SERVER:
          createServerLambda(lambda, httpApi);
          break;
        case LambdaFunctionType.PUBLISH:
          createPublishLambda(lambda, httpApi);
          break;
        default:
          console.log(`Unknown lambda type: ${lambda.type}`);
      }
    }
  }

  new aws.apigatewayv2.Stage("poc-http-api-stage", {
    apiId: httpApi.id,
    name: apiGatewayConfig!.stage,
    autoDeploy: true,
  });

  const apiGatewayOriginId = `poc-http-api-origin-${environment}`;
  const apiGatewayOriginDomain = pulumi.interpolate`${httpApi.id}.execute-api.${aws.getRegionOutput().region}.amazonaws.com`;
  new aws.cloudfront.Distribution("poc-http-api-cloudfront", {
    comment: `msinfraops-poc-backend-${environment}`,
    enabled: true,
    isIpv6Enabled: true,
    // aliases: [`${domain}.${domainZone}`],
    origins: [{
      domainName: apiGatewayOriginDomain,
      originId: apiGatewayOriginId,
      originPath: `/${apiGatewayConfig!.stage}`,
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
      },
    }],
    defaultCacheBehavior: {
      allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: apiGatewayOriginId,
      viewerProtocolPolicy: "redirect-to-https",
      compress: true,
      cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      originRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac",
    },
    priceClass: "PriceClass_200",
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    // viewerCertificate: {
    //   acmCertificateArn: certificateArn!,
    //   sslSupportMethod: "sni-only",
    //   minimumProtocolVersion: "TLSv1.2_2021",
    // },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    }
  });

//   new aws.route53.Record("poc-http-api-alias", {
//     zoneId: domainZoneOutput.zoneId,
//     name: `${domain}.${domainZone}`,
//     type: "A",
//     aliases: [
//       {
//         name: cloudfrontDistribution.domainName,
//         zoneId: cloudfrontDistribution.hostedZoneId,
//         evaluateTargetHealth: false,
//       },
//     ],
//   });
}
