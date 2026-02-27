# MeaningSphere backend project

The following projects contains AWS lambda functions for MOSS microapplications.

There are two types of lambda functions:

1. SNS->SQS->Lambda
   1. send-email
   2. register
   3. save-survey
2. APIGateway->Lambda
   1. api (using Hapi server)

## Start application

To start application you need to create `.env` file using `.env.example` sample.

Local development start:

```bash
npm run dev
```

To create deployment package run:

```bash
npm run package
```

archives will be created in `.serverless` folder.

## Supported countries

To add or remove country from MS supported countries you need to modify `src/assets/msCountries.json` file and add three letter country code in array.

## View OpenAPI documentation

> [!NOTE]
> Remember you need to have docker installed.

Here are command that pull `swagger-ui` docker image and starts container with our OpenAPI documentation:

```bash
docker run -p 8080:8080 -e SWAGGER_JSON=/tmp/openapi.yaml -v $(pwd)/openapi.yaml:/tmp/openapi.yaml swaggerapi/swagger-ui
```

then open `http://localhost:8080` in your favorite browser.

## Command-line interface

To run the command-line interface first need to build the application using the command:

```bash
npm run build
```

Before starting cli need to have following environment variables:

- MS_DEPLOY_ENV - MS deployment environment (aws)
- MS_ENV - MS instance (dev, ua, preprod, prod)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_SESSION_TOKEN

The following command will show all available options:

```bash
node build/cli.js -h
```

### Comms and branding report

Following command will generate report from 1 January 2024 at 00:00:00 to 1 February 2024 at 00:00:00.

```bash
node build/cli.js report CommsAndBrand 01-01-2024-00:00:00 01-02-2024-00:00:00
```

### Survey Report Generation

To generate a survey report using the provided `data`, run the following command:

```bash
node build/cli.js generate -f {REPORT_OUTPUT_FORMAT} {REPORT_TYPE} "{REPORT_JSON_DATA}"
```

#### Parameters

- **`{REPORT_OUTPUT_FORMAT}`**: Specifies the format of the report. Available options are:
  - `html`
  - `pdf`
- **`{REPORT_TYPE}`**: Specifies the type of the report. The currently supported value is `MWI`.
- **`{REPORT_JSON_DATA}`**: A JSON string containing the data needed to fetch relevant information from the database and generate the report.

#### Example Commands

Here is an example of how to use the command to generate a PDF report of type `MWI` with JSON data:

```bash
node build/cli.js generate -f pdf MWI '{"surveyId": "asdq3rf12qecq13grvq1"}'
```

To add guide (or other) permissions:

```bash
node build/cli.js update addUserDetailsType someguide@meaningsphere.guide MS_GUIDE
```

and to remove guide permissions:

```bash
node build/cli.js update removeUserDetailsType someguide@meaningsphere.guide MS_GUIDE
```

The list of assignable permissions can be found in:

```text
msinfraops-dev-apps/code/packages/gui-sdk/src/models/User.ts
```
