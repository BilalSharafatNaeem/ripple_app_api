import Airtable from 'airtable';
import express from 'express';
import cors from 'cors';
import {customSubscriptionResponse, customUserResponse, customResponse} from "./user-profile-response";

var bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json())

// Express configuration
app.set('port', process.env.PORT || 4000);

var corsOptions = {
    origin: ['http://localhost:3000', 'http://dev.rippleapp.mashghol.com', 'https://dev.rippleapp.mashghol.com'],
    optionsSuccessStatus: 200,
    methods: 'GET,POST, PUT',
};

app.use(cors(corsOptions));

app.get('/', (_req, res) => {
    res.send('Server Working!');
});

app.get('/dictionary', function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('ProdDictionary');

        table
            .select()
            .firstPage()
            .then((result) => {
                return res.send(result);
            })
            .catch((err) => {
                return res.send(err.message);
            });
    } catch (error) {
        return res.send({error: error});

    }
});

app.get('/users', function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Users');

        table
            .select()
            .firstPage()
            .then((result) => {
                return res.send(result);
            })
            .catch((err) => {
                return res.send(err.message);
            });
    } catch (error) {
        return res.send({error: error});
    }
});

app.get('/delete_users', function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Users');

        table
            .select()
            .all()
            .then((result) => {
                result.map((r) => {
                    console.log('id', r.id);
                    table.destroy(r.id, (err, deletedRecord) => {
                        if (err) {
                            console.error(err)
                        }
                    })
                });
                return res.send(result);
            })
            .catch((err) => {
                return res.send(err.message);
            });
    } catch (error) {
        return res.send({error: error});

    }
});

app.post('/login', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Users');
        const name = req.body.name;
        const email = req.body.email;
        const social_token = req.body.social_token;
        const phone_number = req.body.phone_number;
        if(phone_number){
            const checkNumber = await table.select({
                filterByFormula: `phone_number = "${phone_number}"`
            });
            const user = await checkNumber.firstPage();
            if(user && user.length && user.length >0){
                return res.send(customUserResponse('User login Successfully.',200,user[0].fields))
            }
        }
        if(social_token){
            const userData = await table.select({
                filterByFormula: `social_token = "${social_token}"`
            });
            const data = await userData.firstPage();
            if(data && data.length && data.length >0){
                return res.send(customUserResponse('User login Successfully.',200,data[0].fields))
            }
        }

      await table.create({
            "name":name,
            "email": email,
            "social_token": social_token,
            "phone_number": phone_number
        }, (err:any, record:any ) => {
            if (err) {
                console.error(err)
                return res.send({error: err}).status(422);
            }
            return res.send(customUserResponse('User login Successfully.',200,record.fields));
        });

    } catch (error) {
        return res.send({error: error});
    }
});

app.post('/create_subscription',async function (req,res) {
    try{
        const base = new Airtable({apiKey:'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Subscriptions');
        console.log('table',table);
        const user_id = req.body.user_id;
        const subscription_plan = req.body.subscription_plan;
        const subscription_type = req.body.subscription_type;

        console.log('user id',user_id,'subscription_plan',subscription_plan,'subscription_type',subscription_type);
        let today = new Date();
        console.log('current date time',today);

        let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date+' '+time;

        if(!user_id){
            return res.status(422).send(customResponse('User id is required',422,{}));
        }
        if(!subscription_plan){
            return res.status(422).send(customResponse('Subscription plan is required',422,{}));
        }
        if(!subscription_type){
            return res.status(422).send(customResponse('Subscription type is required',422,{}));
        }
        console.log('checking data');
        table.create({
            "user_id":[user_id],
            "subscription_plan": subscription_plan,
            "subscription_type": subscription_type,
            "status": true
        }, (err: any, record: any) => {
            if (err) {
                console.error('checking', err);
                return res.send({error: err}).status(422);
            }
            console.log('checking record',record);
            return res.send(customSubscriptionResponse('Subscription created Successfully.', 200, record.fields));
        });
    }catch (error) {
        console.log('checking',error);
        return res.send({error:error});
    }

});
app.post('/check_subscription',async function (req,res) {
    try{
        const base = new Airtable({apiKey:'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Subscriptions');
        console.log('table',table);
        const user_id = req.body.user_id;
        if(!user_id){
            return res.status(422).send(customResponse('User id is required',422,{}));
        }
        const checkUser = await table.select({
            filterByFormula: `user_id = "${user_id}"`,
        });

        const user = await checkUser.firstPage();
        console.log('user length',user.length);
        if(user && user.length && user.length >0){
            return res.send(customSubscriptionResponse('Subscription detail.', 200, user[0].fields));
        }else{
            return res.send(customSubscriptionResponse('detail not found.', 200, {}));
        }

    }catch (error) {
        console.log('checking',error);
        return res.send({error:error});
    }

});
app.get('/subscribed_users_count',async function (req,res) {
    try{
        const base = new Airtable({apiKey:'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Subscriptions');
        const checkUserSubscription = await table.select({
            filterByFormula: `subscription_type = "premium"`,
        });
        const subscriberCount = await checkUserSubscription.all();
        return res.send(customResponse('Subscriber count.', 200, subscriberCount.length));

    }catch (error){
        return res.send({error:error});
    }
});

const port = app.get('port');
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

export default server;
