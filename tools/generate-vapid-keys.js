const webPush = require('web-push');

const keys = webPush.generateVAPIDKeys();

process.stdout.write([
  `KIU_VAPID_PUBLIC_KEY=${keys.publicKey}`,
  `KIU_VAPID_PRIVATE_KEY=${keys.privateKey}`
].join('\n'));
