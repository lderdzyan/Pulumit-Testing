import * as pulumi from "@pulumi/pulumi";
import { deployFrontend } from "./frontend";
import { deployBackend } from "./backend";
import { deployData } from "./database";

const stack = pulumi.getStack();

if (stack.startsWith("frontend")) {
  deployFrontend();
} else if(stack.startsWith("backend")){
  deployBackend();
}else if( stack.startsWith("database")){
  deployData();
}
else {
  throw new Error(`Unknown stack naming: ${stack}`);
}
