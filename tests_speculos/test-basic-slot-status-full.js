'use strict';

import * as common from './common.js';
import { default as OnflowLedgerMod } from "@onflow/ledger";
import { fileURLToPath } from 'url';
import assert from 'assert/strict';

var scriptName = common.path.basename(fileURLToPath(import.meta.url));

common.testStart(scriptName);

const FlowApp = OnflowLedgerMod.default;
const transport = await common.getSpyTransport()
const app = new FlowApp(transport);

console.log(common.humanTime() + " // using FlowApp below with transport() to grab apdu command without sending it");

await common.curlScreenShot(scriptName); console.log(common.humanTime() + " // screen shot before sending first apdu command");

//slotStatus test when there are no slots
common.testStep(" - - -", "await app.slotStatus() // Check initial status");
const slotStatusResponse = await app.slotStatus();
console.log(slotStatusResponse)
assert.equal(slotStatusResponse.returnCode, 0x9000);
assert.equal(slotStatusResponse.errorMessage, "No errors");
let expectedBuffer = Buffer.alloc(64);
expectedBuffer.fill(0);
assert.equal(slotStatusResponse.status.toString("hex"), expectedBuffer.toString("hex"));

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "3310000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009000";
common.compare(hexIncomming, hexExpected, "apdu response", {slotStatus:64, returnCode:2, unexpected:9999});

//setSlot 10
const expectedSlot = 10;
const expectedAccount = "e467b9dd11fa00df";
const scheme = FlowApp.Signature.SECP256K1 | FlowApp.Hash.SHA2_256;
const expectedPath = `m/44'/539'/${scheme}'/0/0`;
common.testStep(" - - -", "app.setSlot() // expectedSlot=" + expectedSlot + " expectedAccount=" + expectedAccount + " expectedPath=" + expectedPath + "; Set slot 10");
const setSlotPromise = app.setSlot(expectedSlot, expectedAccount, expectedPath);
common.testStep("   +  ", "buttons");
if (process.env.TEST_DEVICE && process.env.TEST_DEVICE == "nanox") {
    common.curlScreenShot(scriptName); common.curlButton('right', "; Please review");
}
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Set Account 10");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Account e467..");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Path 44'/..");
await common.curlScreenShot(scriptName); common.curlButton('both', "; confirm; Approve");
await common.curlScreenShot(scriptName); console.log(common.humanTime() + " // back to main screen");
common.testStep(" - - -", "await setSlotPromise // expectedSlot=" + expectedSlot + " expectedAccount=" + expectedAccount + " expectedPath=" + expectedPath + "; Set slot 10");
const setSlotResponse = await setSlotPromise
assert.equal(setSlotResponse.returnCode, 0x9000);

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "331200001d0ae467b9dd11fa00df2c0000801b020080010200800000000000000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, slotBytes:28, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "9000";
common.compare(hexIncomming, hexExpected, "apdu response", {returnCode:2, unexpected:9999});

//test slotstatus when slot 10 is used
common.testStep(" - - -", "await app.slotStatus() // Get slot status");
const slotStatusResponse2 = await app.slotStatus();
assert.equal(slotStatusResponse2.returnCode, 0x9000);
assert.equal(slotStatusResponse2.errorMessage, "No errors");
expectedBuffer = Buffer.alloc(64);
expectedBuffer.fill(0);
expectedBuffer[10] = 1;
assert.equal(slotStatusResponse2.status.toString("hex"), expectedBuffer.toString("hex"));

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "3310000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009000";
common.compare(hexIncomming, hexExpected, "apdu response", {slotStatus:64, returnCode:2, unexpected:9999});

//test get slot on used slot 10
common.testStep(" - - -", "await app.getSlot() // expectedSlot=" + expectedSlot + "; Get slot 10 back");
const getSlotResponse = await app.getSlot(expectedSlot);
assert.equal(getSlotResponse.returnCode, 0x9000);
assert.equal(getSlotResponse.account, expectedAccount);
assert.equal(getSlotResponse.path, expectedPath);

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "33110000010a";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "e467b9dd11fa00df2c0000801b0200800102008000000000000000009000";
common.compare(hexIncomming, hexExpected, "apdu response", {account:8, path:20, returnCode:2, unexpected:9999});

//getSlot for an empty slot
const emptySlot = 3;
common.testStep(" - - -", "await app.getSlot() // emptySlot=" + emptySlot + "; Get empty slot should error");
const getSlotResponse2 = await app.getSlot(emptySlot);
assert.equal(getSlotResponse2.returnCode, 0x6982);
assert.equal(getSlotResponse2.errorMessage, "Empty Buffer");


assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 0) //Transport throws an error, our spy as of now does not catch apdu
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "331100000103";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, unexpected:9999});
//var hexIncomming = transport.hexApduCommandIn.shift();
//var hexExpected = "6982";
//common.compare(hexIncomming, hexExpected, "apdu response", {returnCode:2, unexpected:9999});

//setSlot 10 - update slot
const expectedAccount2 = "e467b9dd11fa00de"; //this is not a proper account but the app does not test it
const expectedPath2 = `m/44'/539'/${scheme}'/0/1`;
common.testStep(" - - -", "app.setSlot() // expectedSlot=" + expectedSlot + " expectedAccount2=" + expectedAccount2 + " expectedPath2=" + expectedPath2 + "; Set slot 10");
const setSlotPromise2 = app.setSlot(expectedSlot, expectedAccount2, expectedPath2);
common.testStep("   +  ", "buttons");
if (process.env.TEST_DEVICE && process.env.TEST_DEVICE == "nanox") {
    await common.curlScreenShot(scriptName); common.curlButton('right', "; Please review");
}
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Update Account 10");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Old Account e467..");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Old Path 44'/..");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; New Account e467..");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; New Path 44'/..");
await common.curlScreenShot(scriptName); common.curlButton('both', "; confirm; Approve");
await common.curlScreenShot(scriptName); console.log(common.humanTime() + " // back to main screen");
common.testStep(" - - -", "await setSlotPromise // expectedSlot=" + expectedSlot + " expectedAccount2=" + expectedAccount2 + " expectedPath=2" + expectedPath2 + "; Set slot 10");
const setSlotResponse2 = await setSlotPromise2
assert.equal(setSlotResponse2.returnCode, 0x9000);

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "331200001d0ae467b9dd11fa00de2c0000801b020080010200800000000001000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, slotBytes:28, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "9000";
common.compare(hexIncomming, hexExpected, "apdu response", {returnCode:2, unexpected:9999});

//test slotstatus when slot 10 is used
common.testStep(" - - -", "await app.slotStatus() // Get slot status");
const slotStatusResponse3 = await app.slotStatus();
assert.equal(slotStatusResponse3.returnCode, 0x9000);
assert.equal(slotStatusResponse3.errorMessage, "No errors");
expectedBuffer = Buffer.alloc(64);
expectedBuffer.fill(0);
expectedBuffer[10] = 1;
assert.equal(slotStatusResponse3.status.toString("hex"), expectedBuffer.toString("hex"));

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "3310000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009000";
common.compare(hexIncomming, hexExpected, "apdu response", {slotStatus:64, returnCode:2, unexpected:9999});

//test get slot on used slot 10
common.testStep(" - - -", "await app.getSlot() // expectedSlot=" + expectedSlot + "; Get slot 10 back");
const getSlotResponse3 = await app.getSlot(expectedSlot);
assert.equal(getSlotResponse3.returnCode, 0x9000);
assert.equal(getSlotResponse3.account, expectedAccount2);
assert.equal(getSlotResponse3.path, expectedPath2);

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "33110000010a";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "e467b9dd11fa00de2c0000801b0200800102008000000000010000009000";
common.compare(hexIncomming, hexExpected, "apdu response", {account:8, path:20, returnCode:2, unexpected:9999});

//Now delete the slot so that the next test starts in a clean state
const expectedAccountDelete = "0000000000000000";
const expectedPathDelete = `m/0/0/0/0/0`;
common.testStep(" - - -", "app.setSlot() // expectedSlot=" + expectedSlot + " expectedAccountDelete=" + expectedAccountDelete + " expectedPathDelete=" + expectedPathDelete + "; Delete slot 10");
const setSlotPromise3 = app.setSlot(10, expectedAccountDelete, expectedPathDelete);
common.testStep("   +  ", "buttons");
if (process.env.TEST_DEVICE && process.env.TEST_DEVICE == "nanox") {
    await common.curlScreenShot(scriptName); common.curlButton('right', "; Please review");
}
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Delete Account 10");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Old Account e467..");
await common.curlScreenShot(scriptName); common.curlButton('right', "; navigate the address / path; Old Path 44'/..");
await common.curlScreenShot(scriptName); common.curlButton('both', "; confirm; Approve");
await common.curlScreenShot(scriptName); console.log(common.humanTime() + " // back to main screen");
common.testStep(" - - -", "await setSlotPromise2 // expectedSlot=" + expectedSlot + " expectedAccountDelete=" + expectedAccountDelete + " expectedPathDelete=" + expectedPathDelete + "; Delete slot 10");
const setSlotResponse3 = await setSlotPromise3;
assert.equal(setSlotResponse3.returnCode, 0x9000);

assert.equal(transport.hexApduCommandOut.length, 1)
assert.equal(transport.hexApduCommandIn.length, 1)
var hexOutgoing = transport.hexApduCommandOut.shift();
var hexExpected = "331200001d0a00000000000000000000000000000000000000000000000000000000";
common.compare(hexOutgoing, hexExpected, "apdu command", {cla:1, ins:1, p1:1, p2:1, len:1, slot:1, slotBytes:28, unexpected:9999});
var hexIncomming = transport.hexApduCommandIn.shift();
var hexExpected = "9000";
common.compare(hexIncomming, hexExpected, "apdu response", {returnCode:2, unexpected:9999});

//screen shot should not change so do not: common.curlScreenShot(scriptName);
await transport.close()
common.testEnd(scriptName);