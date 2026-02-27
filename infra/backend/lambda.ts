import * as aws from "@pulumi/aws";
import { Environment } from "@pulumi/aws/appconfig";
import * as pulumi from "@pulumi/pulumi";

export enum PolicyType {
  SNS = "SNS",
  SQS = "SQS",
  DynamoDB = "DynamoDB",
  SES = "SES",
  AWS = "AWS",
  KMS = "KMS",
}
export enum LambdaFunctionType {
  PUBLISH = "PUBLISH",
  SERVER = "SERVER",
}
export interface Policy {
  sid: string;
  type: PolicyType;
  actions: string[];
  resources: string[];
}
export interface LambdaFunction {
  name: string;
  path?: string;
  timeout?: number;
  handler: string;
  runtime: string;
  policies: Policy[];
  method?: "POST" | "GET" | "PUT" | "ANY";
  environment?: Record<string, string>;
  layers?: string[];
  authorizers?: string[];
  kmsKeyPolicy?: "VERIFY" | "SIGN";
  batchSize?: number;
}
export interface PublishLambdaFunction extends LambdaFunction {
  type: LambdaFunctionType.PUBLISH;
}
export interface ServerLambdaFunction extends LambdaFunction {
  type: LambdaFunctionType.SERVER;
}

export type LambdaFunctions = PublishLambdaFunction | ServerLambdaFunction;

export function createLambdaExecRole(name: string, policies: Policy[]) {
  const lambdaExecRoleAssume = aws.iam.getPolicyDocument({
    statements: [{
      actions: ["sts:AssumeRole"],
      principals: [{
        type: "Service",
        identifiers: ["lambda.amazonaws.com"],
      }],
    }],
  });

  const lambdaExecRolePolicy = aws.iam.getPolicyDocumentOutput({
    statements: policies.map((policy) => ({
      sid: policy.sid,
      actions: policy.actions,
      resources: policy.resources.map((resource) => interpolateResource(resource, policy.type)).flat(),
    })),
  });

  const lambdaExecRole = new aws.iam.Role(`${name}-exec-role`, {
    assumeRolePolicy: lambdaExecRoleAssume.then(assume => assume.json),
  });

  new aws.iam.RolePolicy(`${name}-exec-role-policy`, {
    role: lambdaExecRole.id,
    policy: lambdaExecRolePolicy.json,
  });

  new aws.iam.RolePolicyAttachment(`${name}-exec-role-basic`, {
    role: lambdaExecRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  return lambdaExecRole;
}

function interpolateResource(name: string, type: PolicyType): pulumi.Output<string>[] {
  switch (type) {
    case PolicyType.DynamoDB: return interpolateDynamoDbResource(name);
    default:
      return [pulumi.output("*")];
  }
}

function interpolateDynamoDbResource(name: string): pulumi.Output<string>[] {
  const dynamoDb = aws.dynamodb.getTableOutput({ name });
  return [dynamoDb.arn, pulumi.output(pulumi.interpolate`${dynamoDb.arn}/index/*`)];
}

export function createLambdaFunction(lambda: LambdaFunction) {
  const config = new pulumi.Config();
  const guiUrl = config.get("gui-url");
  const archivePath = pulumi.runtime.isDryRun() ? "lambdas/template.zip" : `lambdas/${lambda.name}.zip`;
  const lambdaExecRole = createLambdaExecRole(lambda.name, lambda.policies);
  const lambdaInstance = new aws.lambda.Function(`${lambda.name}-lambda`, {
    code: new pulumi.asset.FileArchive(archivePath),
    name: `${lambda.name}-${config.get("environment")}`,
    role: lambdaExecRole.arn,
    handler: lambda.handler,
    runtime: lambda.runtime,
    publish: true,
    environment: {
      variables: {
        MS_GUI_URL: guiUrl ?? "",
        ...lambda.environment
      }
    }
  });
  return { lambdaInstance, lambdaExecRole };
}
