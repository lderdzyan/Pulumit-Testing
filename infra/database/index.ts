import * as aws from "@pulumi/aws";
import { Environment } from "@pulumi/aws/appconfig";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const tables = config.getObject<Table[]>("tables");
const environment = config.get("environment");

interface Attribute {
  name: string;
  type: string;
}
interface SecondaryIndex {
  name: string;
  hashKey: string;
  rangeKey: string;
  projectionType: string;
  readCapacity: number;
  writeCapacity: number;
}
interface Table {
  name: string;
  billingMode: string;
  hashKey: string;
  rangeKey: string;
  enableRecovery: boolean;
  attributes: Attribute[];
  globalSecondaryIndex: SecondaryIndex[];
}
// change 45 rope CG3
export function deployData() {
  tables?.forEach((table) => {
    console.log(table);
    new aws.dynamodb.Table(`${table.name}-table`, {
      name: `${table.name}-${environment}`,
      billingMode: table.billingMode,
      hashKey: table.hashKey,
      rangeKey: table.rangeKey,
      attributes: table.attributes,
      globalSecondaryIndexes: table.globalSecondaryIndex,
    });
  });
}
