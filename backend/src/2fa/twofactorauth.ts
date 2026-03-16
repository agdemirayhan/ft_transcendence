import { TOTP } from 'otpauth';
type QRCodeModule = {
	toDataURL?: (text: string) => Promise<string>;
	default?: {
		toDataURL?: (text: string) => Promise<string>;
	};
};

export interface TwoFactorAuth
{
	secret: string;
	otpauthUrl: string;
	qrCodeDataUrl: string;
}

export async function generateSecret(userEmail: string): Promise<TwoFactorAuth>
{
	const qrCodeModule = require('qrcode') as QRCodeModule;
	const toDataURL = qrCodeModule.toDataURL ?? qrCodeModule.default?.toDataURL;
	if (!toDataURL) {
		throw new Error('QRCode.toDataURL is unavailable');
	}

	const totp = new TOTP({
	issuer: 'Transcendence',
	label: userEmail,
	algorithm: 'SHA1',
	digits: 6,
	period: 30,
	});
	const secret = totp.secret.base32;
	const otpauthUrl = totp.toString();
	const qrCodeDataUrl = await toDataURL(otpauthUrl);
	return {secret, otpauthUrl, qrCodeDataUrl};
}

export function verifyToken(token: string, secret: string): boolean
{
	const totp = new TOTP({secret});
	const delta = totp.validate({token, window: 1});
	return delta !== null;
}
