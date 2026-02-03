import { SignJWT, importPKCS8 } from 'jose';

export async function sendPushNotification(
    fcmToken: string, 
    title: string, 
    body: string, 
    data: Record<string, string>,
    serviceAccountJson: string,
    kv: KVNamespace
): Promise<boolean> {
    if (!serviceAccountJson) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
        return false;
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
        console.error("Failed to parse Service Account JSON", e);
        return false;
    }

    const accessToken = await getAccessToken(serviceAccount, kv);
    if (!accessToken) {
        console.error("Failed to get Access Token");
        return false;
    }

    // FCM v1 API Payload
    const payload = {
        message: {
            token: fcmToken,
            notification: {
                title: title,
                body: body
            },
            data: data,
            android: {
                priority: "HIGH"
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default"
                    }
                }
            }
        }
    };

    try {
        const projectId = serviceAccount.project_id;
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`FCM Send Failed: ${response.status} ${text}`);
            return false;
        }

        return true;
    } catch (e) {
        console.error("Error sending push", e);
        return false;
    }
}

async function getAccessToken(serviceAccount: any, kv: KVNamespace): Promise<string | null> {
    const KV_KEY = "firebase_access_token";
    
    // 1. Check KV Cache
    const cachedToken = await kv.get(KV_KEY);
    if (cachedToken) {
        return cachedToken;
    }

    // 2. Generate new token
    try {
        const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');
        const jwt = await new SignJWT({
            iss: serviceAccount.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token"
        })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        params.append('assertion', jwt);

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Token exchange failed", text);
            return null;
        }

        const data: any = await response.json();
        const accessToken = data.access_token;
        const expiresIn = data.expires_in; // usually 3600 seconds

        // 3. Cache in KV (set TTL slightly less than expiration)
        await kv.put(KV_KEY, accessToken, { expirationTtl: expiresIn - 60 });
        
        return accessToken;
    } catch (e) {
        console.error("Error generating access token", e);
        return null;
    }
}
