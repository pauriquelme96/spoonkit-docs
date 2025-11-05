import { $batch } from "../lib/signals/$batch";
import { $untracked } from "../lib/signals/$untracked";
import { calc } from "../lib/signals/Calc";
import { monitor } from "../lib/signals/Monitor";
import { state } from "../lib/signals/State";
import { stateArray } from "../lib/signals/stateArray";

const name = state("John Doe");
const fullName = calc(() => `Full Name: ${name.get()}`);
const mirrorName = state(fullName);

mirrorName.set("Jane Smith");

const emails = stateArray(() => state<string>());

emails.set(["email1", "email2"]);

const emailsAreValid = emails.every((email) => email.includes("@"));

monitor(() => {
  console.log("Emails are valid:", emailsAreValid.get());
});

emails.at(0).set("email1@example.com");
emails.at(1).set("email2@example.com");

$untracked(() => {});
$batch(() => {});
