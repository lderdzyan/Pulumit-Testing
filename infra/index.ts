import * as pulumi from "@pulumi/pulumi";
import { deployFrontend } from "./frontend";
import { deployBackend } from "./backend";

const stack = pulumi.getStack();

if (stack.startsWith("frontend")) {
  deployFrontend();
} else if(stack.startsWith("backend")){
  deployBackend();
}else {
  throw new Error(`Unknown stack naming: ${stack}`);
}
