import sqlite3 from "sqlite3";
import { open } from "sqlite";

import fs from "fs";
import path from "path";
import crypto from "crypto";

import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

import { promisify } from "util";
import { exec } from "child_process";
const promisifiedExec = promisify(exec);

export const getCurrentChromeInstagramSessionId = async () => {
  try {
    const userDataDataPath = getChromeUserDataPath();
    const cookiesFilePath = getChromeCookiesFilePath(userDataDataPath, "Default");
    
    const encryptedKey = getChromeEncryptedKey(userDataDataPath);
    const decryptedKey = await decryptChromeKey(encryptedKey);
    
    const encryptedValue = await getChromeCookieEncryptedValue(".instagram.com", "sessionid", cookiesFilePath);
    const decryptedValue = decryptChromeCookieValue(encryptedValue, decryptedKey);

    return decryptedValue;
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

const getChromeUserDataPath = () => {
  return path.resolve(process.env.LOCALAPPDATA, "Google/Chrome/User Data");
}

const getChromeCookiesFilePath = (userDataPath, profile) => {
  return path.join(userDataPath, profile, "Network", "Cookies");
}

const getChromeEncryptedKey = (userDataPath) => {
  try {
    const localStateFilePath = path.join(userDataPath, "Local State");
    if (!fs.existsSync(localStateFilePath)) {
      console.error("Chrome Local State file wasn't found!");
      return null;
    }
  
    const fileText = fs.readFileSync(localStateFilePath, "utf-8");
    const json = JSON.parse(fileText);

    const keyBase64 = json.os_crypt.encrypted_key;
    const keyBuffer = Buffer.from(keyBase64, "base64");

    const array = new Uint8Array(keyBuffer).slice("DPAPI".length);
    return Buffer.from(array);
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

const decryptChromeKey = async (encryptedKey) => {
  try {
    return await CryptUnprotectData(encryptedKey);
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

const getChromeCookieEncryptedValue = async (domain, name, cookiesFilePath = getChromeCookiesFilePath()) => {
  let encrypted_value;
  try {
    const db = await open({
      filename: cookiesFilePath,
      driver: sqlite3.Database,
    });

    encrypted_value = (await db.get(`SELECT encrypted_value FROM cookies WHERE host_key = '${domain}' AND name = '${name}'`)).encrypted_value;

    await db.close();
  } catch (err) {
    console.error(err.message);
    return null;
  }

  return encrypted_value;
}

const decryptChromeCookieValue = (encryptedValue, decryptedKey) => {
  const encryptedValueArray = new Uint8Array(encryptedValue);

  const iv         = encryptedValueArray.slice("v10".length, "v10".length + 12);
  const cipherText = encryptedValueArray.slice("v10".length + 12, encryptedValueArray.length - 16);
  const authTag    = encryptedValueArray.slice(encryptedValueArray.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", decryptedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = decipher.update(cipherText);
  return decrypted.toString("utf-8");
}

const CryptUnprotectData = async (encryptedData) => {
  const scriptFileName = path.join(__dirname, "CryptoUnprotectData.ps1");
  
  const encryptedDataBase64 = encryptedData.toString("base64");
  const result = await promisifiedExec(`powershell.exe ${scriptFileName} ${encryptedDataBase64}`);
  if (result.stderr.length > 0) {
    throw new Error(result.stderr);
  }

  const decryptedDataBase64 = result.stdout.trim();
  return Buffer.from(decryptedDataBase64, "base64");
}