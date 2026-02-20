import * as pulumi from "@pulumi/pulumi";
import { deployFrontend } from "./frontend";


const stack = pulumi.getStack();

if (stack.startsWith("frontend")) {
  deployFrontend();
} else {
  throw new Error(`Unknown stack naming: ${stack}`);
}
