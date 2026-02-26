import { TOTP } from 'otpauth';
import QRCode from 'qrcode';
import Test from "qrcode-terminal";
import readline from "node:readline/promises"
import {stdin as input, stdout as output } from "node:process"


export interface TwoFactorAuth
{
	secret: string;
	otpauthUrl: string;
	qrCodeDataUrl: String;
}

export async function generateSecret(userEmail: string): Promise<TwoFactorAuth>
{
	const totp = new TOTP({
	issuer: 'Transcendence',
	label: userEmail,
	algorithm: 'SHA1',
	digits: 6,
	period: 30,
	});
	const secret = totp.secret.base32;
	const otpauthUrl = totp.toString();
	const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
	return {secret, otpauthUrl, qrCodeDataUrl};
}

export function verifyToken(token: string, secret: string): boolean
{
	const totp = new TOTP({secret});
	const delta = totp.validate({token, window: 1});
	return delta !== null;
}


async function run() {
	const result = await generateSecret("ldick@student.42heilbronn.de");
	const rl = readline.createInterface({input, output});
	Test.generate(result.otpauthUrl, {small: true});
	const n  = await rl.question("enter code: ");
	n.trim();
	const isvalid = verifyToken(n, result.secret);
	console.log(isvalid ? "yes" : "no");
	rl.close()
}

run();