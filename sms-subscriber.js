var mqtt = require('mqtt')
const Nexmo = require('nexmo');
var client = mqtt.connect("http://localhost", {
  port:  1883
});

client.on('connect', function () {
    client.subscribe('sms')
})
client.on('message',async function (topic, message) {
    context = message.toString();
    console.log(context)
    const nexmo = new Nexmo({
      apiKey: '18a1f319',
      apiSecret: '2kk2wARBHxCxgzOe',
    });
    const from = 'Suraksha -Personal Safety System';
    const to = '918210798405';
    const text = ` Welcome to Suraksha . Thanks for Registration.` ;
    
    nexmo.message.sendSms(from, to, text);
      
})