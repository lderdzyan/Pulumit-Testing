import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createLambdaFunction, ServerLambdaFunction } from "./lambda";

export default function createServerLambda(lambda: ServerLambdaFunction, httpApi: aws.apigatewayv2.Api): void {
  const { lambdaInstance } = createLambdaFunction(lambda);

  if (lambda.path != null) {
    const httpApiExecutionArn = pulumi.interpolate`arn:aws:execute-api:${aws.getRegionOutput().region}:${aws.getCallerIdentityOutput().accountId}:${httpApi.id}/*`;
    new aws.lambda.Permission(`${lambda.name}-http-api-permission`, {
      action: "lambda:InvokeFunction",
      function: lambdaInstance.arn,
      principal: "apigateway.amazonaws.com",
      sourceArn: httpApiExecutionArn,
    });

    const integration = new aws.apigatewayv2.Integration(`${lambda.name}-integration`, {
      apiId: httpApi.id,
      integrationType: "AWS_PROXY",
      integrationUri: lambdaInstance.invokeArn,
      payloadFormatVersion: "2.0",
    });

    const normalizedPath = lambda.path.startsWith("/") ? lambda.path : `/${lambda.path}`;
    const routeKey = `ANY ${normalizedPath}`;

    new aws.apigatewayv2.Route(`${lambda.name}-route`, {
      apiId: httpApi.id,
      routeKey: routeKey,
      target: pulumi.interpolate`integrations/${integration.id}`,
    });
  }
}
