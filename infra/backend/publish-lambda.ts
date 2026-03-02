import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createLambdaFunction, PublishLambdaFunction } from "./lambda";

export default function createPublishLambda(lambda: PublishLambdaFunction, httpApi: aws.apigatewayv2.Api): void {
  const { lambdaInstance, lambdaExecRole } = createLambdaFunction(lambda);

  const sqsQueue = new aws.sqs.Queue(`${lambda.name}-queue`, {
    name: `${lambda.name}.fifo`,
    fifoQueue: true,
    visibilityTimeoutSeconds: lambda.timeout,
    contentBasedDeduplication: true,
  });

  new aws.lambda.EventSourceMapping(`${lambda.name}-sqs-mapping`, {
    eventSourceArn: sqsQueue.arn,
    functionName: lambdaInstance.arn,
    batchSize: lambda.batchSize,
  });

  if (lambda.path == null) {
    const snsTopic = new aws.sns.Topic(`${lambda.name}-sns-topic`, {
      name: `${lambda.name}.fifo`,
      fifoTopic: true,
      contentBasedDeduplication: true,
    });

    new aws.sns.TopicSubscription(`${lambda.name}-sqs-subscription`, {
      topic: snsTopic.arn,
      protocol: "sqs",
      endpoint: sqsQueue.arn,
    });

    const policyDocument = pulumi.all([sqsQueue.arn, snsTopic.arn]).apply(([sqsQueueArn, snsTopicArn]) =>
      aws.iam.getPolicyDocumentOutput({
        statements: [
          {
            actions: ["sqs:SendMessage"],
            effect: "Allow",
            principals: [{ type: "Service", identifiers: ["sns.amazonaws.com"] }],
            resources: [sqsQueueArn],
            conditions: [{ test: "ArnEquals", variable: "aws:SourceArn", values: [snsTopicArn] }],
          },
          {
            effect: "Allow",
            actions: ["sqs:DeleteMessage", "sqs:ReceiveMessage"],
            resources: [sqsQueueArn],
          },
        ]
      })
    );

    new aws.sqs.QueuePolicy(`${lambda.name}-sqs-policy`, {
      queueUrl: sqsQueue.url,
      policy: policy Document.json,
    });

    new aws.iam.RolePolicy(`${lambda.name}-lambda-sqs-policy`, {
      role: lambdaExecRole.id,
      policy: sqsQueue.arn.apply((queueArn) =>
        aws.iam.getPolicyDocumentOutput({
          statements: [
            {
              effect: "Allow",
              actions: [
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
                "sqs:ChangeMessageVisibility",
              ],
              resources: [queueArn],
            },
          ]
        }).json
      ),
    });
  } else {
    new aws.iam.RolePolicy(`${lambda.name}-sqs-policy`, {
      role: lambdaExecRole.id,
      policy: sqsQueue.arn.apply((queueArn) =>
        aws.iam.getPolicyDocumentOutput({
          statements: [
            {
              effect: "Allow",
              actions: [
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
                "sqs:ChangeMessageVisibility",
              ],
              resources: [queueArn],
            },
          ]
        }).json
      ),
    });

    const apiGatewaySqsRole = new aws.iam.Role(`${lambda.name}-sqs-apigateway-role`, {
      assumeRolePolicy: aws.iam.getPolicyDocumentOutput({
        statements: [{
          effect: "Allow",
          principals: [{ type: "Service", identifiers: ["apigateway.amazonaws.com"] }],
          actions: ["sts:AssumeRole"],
        }]
      }).json,
    });

    new aws.iam.RolePolicy(`${lambda.name}-sqs-apigateway-policy`, {
      role: apiGatewaySqsRole.id,
      policy: sqsQueue.arn.apply((queueArn) =>
        aws.iam.getPolicyDocumentOutput({
          statements: [{
            effect: "Allow",
            actions: ["sqs:SendMessage"],
            resources: [queueArn],
          }]
        }).json,
      ),
    });

    const integration = new aws.apigatewayv2.Integration(`${lambda.name}-sqs-integration`, {
      apiId: httpApi.id,
      integrationType: "AWS_PROXY",
      integrationSubtype: "SQS-SendMessage",
      payloadFormatVersion: "1.0",
      credentialsArn: apiGatewaySqsRole.arn,
      requestParameters: {
        QueueUrl: sqsQueue.url,
        MessageBody: "$request.body",
        MessageGroupId: "default",
        MessageDeduplicationId: "$context.requestId",
      },
    });

    const normalizedPath = lambda.path.startsWith("/") ? lambda.path : `/${lambda.path}`;
    const httpMethod = lambda.method || "POST";
    const routeKey = `${httpMethod} ${normalizedPath}`;

    new aws.apigatewayv2.Route(`${lambda.name}-route`, {
      apiId: httpApi.id,
      routeKey: routeKey,
      target: pulumi.interpolate`integrations/${integration.id}`,
    });
  }
}
