import Airtable from 'airtable';
import express from 'express';
import cors from 'cors';
import {customSubscriptionResponse, customUserResponse, customResponse} from "./user-profile-response";

var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
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
        // const table = base('Subscriptions');


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

app.post('/sign_up', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Users');
        const name = req.body.name;
        const phone_number = req.body.phone_number;
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        console.log('check hash',hashed);
        if (!name) {
            return res.status(422).send(customResponse('name is required', 422, {}));
        }
        if (!password) {
            return res.status(422).send(customResponse('password is required', 422, {}));
        }
        if (!phone_number) {
            return res.status(422).send(customResponse('Phone number is required', 422, {}));
        }
        const checkPhoneNumber = await table.select({
            filterByFormula: `phone_number = "${phone_number}"`
        });
        const users = await checkPhoneNumber.firstPage();
        if (users && users.length && users.length > 0) {
            return res.status(422).send(customResponse('User already exist with this phone number.', 422, {}));
        }
        table.create({
            "name": name,
            "phone_number": phone_number,
            "password": hashed
        }, (err: any, record: any) => {
            if (err) {
                console.error(err)
                return res.send({error: err}).status(422);
            }
            console.log("data",record.id);
            return res.send(customUserResponse('User register Successfully.', 200, record));
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
        const password = req.body.password;
        const phone_number = req.body.phone_number;

        if (phone_number && password) {
            const checkNumber = await table.select({
                filterByFormula: `phone_number = "${phone_number}"`
                // filterByFormula: `AND(phone_number = '${phone_number}', password = '${password}')`
            });
            const user = await checkNumber.firstPage();
            if (user && user.length && user.length > 0) {
                const checkPassword = await bcrypt.compareSync(
                    password,
                    user[0].fields.password
                );
                if(checkPassword === true){
                    return res.send(customUserResponse('User login Successfully.', 200, user[0]))
                }else {
                    return res.status(422).send(customResponse('Invalid credentials', 422, {}));
                }
            }else{
                return res.status(422).send(customResponse('User not exist with these credentials', 422, {}));
            }
        }
        if (social_token) {
            const userData = await table.select({
                filterByFormula: `social_token = "${social_token}"`
            });
            const data = await userData.firstPage();
            if (data && data.length && data.length > 0) {
                return res.send(customUserResponse('User login Successfully.', 200, data[0]))
            }else {
                await table.create({
                    "name": name,
                    "email": email,
                    "social_token": social_token,
                    "phone_number": phone_number
                }, (err: any, record: any) => {
                    if (err) {
                        console.error(err)
                        return res.send({error: err}).status(422);
                    }
                    return res.send(customUserResponse('User login Successfully.', 200, record));
                });
            }

        }


    } catch (error) {
        return res.send({error: error});
    }
});

app.post('/reset_password', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const UserTable = base('Users');
        const phone_number = req.body.phone_number;
        const password = req.body.password;
        if (!phone_number) {
            return res.status(422).send(customResponse('Phone number is required', 422, {}));
        }
        if (!password) {
            return res.status(422).send(customResponse('Password is required', 422, {}));
        }
        const checkNumber = await UserTable.select({
            filterByFormula: `phone_number = "${phone_number}"`
        });
        const userDataRecord = await checkNumber.firstPage();
        if (userDataRecord.length === 0) {
            return res.status(422).send(customResponse('User not exist', 422, {}));
        }
        const userRecord:any= userDataRecord[0].id;
        console.log("user id",userRecord);
        await UserTable.update(userRecord, {
            "password": password,
        }, (err: any, record: any) => {
            console.log("data of record", record);
            if (err) {
                console.log(err);
            }
            return res.send(customResponse('Password updated successfully.', 200, {}));
        });
    } catch (error) {
        return res.send({error: error});
    }
});

app.post('/create_subscription', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Subscriptions');
        const user_id = req.body.user_id;
        const userId = req.body.id;
        const subscription_plan = req.body.subscription_plan;
        const subscription_type = req.body.subscription_type;
        const purchase_id = req.body.purchase_id;
        if (!user_id) {
            return res.status(422).send(customResponse('User id is required', 422, {}));
        }
        if (!subscription_plan) {
            return res.status(422).send(customResponse('Subscription plan is required', 422, {}));
        }
        if (!userId) {
            return res.status(422).send(customResponse('user is required', 422, {}));
        }
        if (!subscription_type) {
            return res.status(422).send(customResponse('Subscription type is required', 422, {}));
        }
        if (!purchase_id) {
            return res.status(422).send(customResponse('purchase id is required', 422, {}));
        }
        var filterByFormula = "AND({purchase_id}='" + purchase_id + "',{user_id} !='" + userId + "')";
        console.log("ddsdfd",filterByFormula);
        const detail = await table.select({
                filterByFormula: filterByFormula
            });
            const data = await detail.all();
            console.log("testing data",data);
        if (data && data.length && data.length > 0) {
            if(data[0].fields.subscription_plan === subscription_plan){
                return res.status(422).send(customResponse('Purchase id is already exist.', 422, {}));
            }else{
                table.create({
                    "user_id": [user_id],
                    "subscription_plan": subscription_plan,
                    "subscription_type": subscription_type,
                    "purchase_id": purchase_id,
                    "status": true
                }, (err: any, record: any) => {
                    if (err) {
                        console.error('checking', err);
                        return res.send({error: err}).status(422);
                    }
                    console.log('checking record1223', record);
                    return res.send(customSubscriptionResponse('Subscription created Successfully.', 200, record.fields));
                });
            }
        }
        const checkPurchaseId = await table.select({
            filterByFormula: `purchase_id = "${purchase_id}"`
        });
        const purchase = await checkPurchaseId.all();

        if (purchase && purchase.length && purchase.length > 0) {
            const record_id:any = purchase[0].id;
            const data1 = await table.update(record_id, {
                "subscription_plan": subscription_plan,
            }, (err: any, record: any) => {
                console.log("data of record", record);
                if (err) {
                    console.log(err);
                }
                return res.send(customSubscriptionResponse('Subscription updated successfully.', 200, record.fields));
            });

        }else{
            table.create({
                "user_id": [user_id],
                "subscription_plan": subscription_plan,
                "subscription_type": subscription_type,
                "purchase_id": purchase_id,
                "status": true
            }, (err: any, record: any) => {
                if (err) {
                    console.error('checking', err);
                    return res.send({error: err}).status(422);
                }
                console.log('checking record', record);
                return res.send(customSubscriptionResponse('Subscription created Successfully.', 200, record.fields));
            });
        }

    } catch (error) {
        console.log('checking', error);
        return res.send({error: error});
    }

});
app.post('/check_subscription', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const usersTable = base('Users');
        const subscriptionTable = base('Subscriptions');
        const user_id = req.body.user_id;
        console.log("testing",user_id);
        if (!user_id) {
            return res.status(422).send(customResponse('User id is required', 422, {}));
        }
        const userQuery = await usersTable.select({
            filterByFormula: `id = "${user_id}"`,
        });
        const user = await userQuery.all();
        console.log("user detail",user[0]);
        if (user.length === 0) {
            return res.status(422).send(customResponse('User not exist', 422, {}));
        }
        const subscriptionQuery = await subscriptionTable.select({
            filterByFormula: `user_id = "${user_id}"`,
        });
        const subscription = await subscriptionQuery.all();
        console.log("check subscription",subscription.length);
        if(subscription && subscription.length && subscription.length > 0) {
            return res.send(customSubscriptionResponse('Subscription detail.', 200, subscription[0].fields));
        } else {
            return res.send(customResponse('detail not found.', 422, {}));
        }

    } catch (error) {
        // console.log("testing121232");
        return res.send({error: error});
    }

});
app.get('/subscribed_users_count', async function (req, res) {
    try {
        const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
        const table = base('Subscriptions');
        const checkUserSubscription = await table.select({
            filterByFormula: `subscription_type = "premium"`,
        });
        const subscriberCount = await checkUserSubscription.all();
        return res.send(customResponse('Subscriber count.', 200, subscriberCount.length));

    } catch (error) {
        return res.send({error: error});
    }
});

app.post('/update_subscription', async function (req, res) {
    const base = new Airtable({apiKey: 'keyeiyOap6PKa91Je'}).base('appoeC1QdH0yXEMyC');
    const usersTable = base('Users');
    const subscriptionsTable = base('Subscriptions');
    const user_id = req.body.user_id;
    // const subscription_type = req.body.subscription_type;
    if (!user_id) {
        return res.status(422).send(customResponse('User id is required', 422, {}));
    }
    const userQuery = await usersTable.select({
        filterByFormula: `id = "${user_id}"`,
    });
    const user = await userQuery.all();
    if (user.length === 0) {
        return res.status(422).send(customResponse('User not exist', 422, {}));
    }
    const subscriptionQuery = await subscriptionsTable.select({
        filterByFormula: `user_id = "${user_id}"`,
    });
    const subscription: any = await subscriptionQuery.all();
    if (subscription.length === 0) {
        return res.status(422).send(customResponse('subscription not exist', 422, {}));
    }
    console.log("test",subscription[0].fields.id);
    // const alreadySubscribedType = subscription[0].fields.subscription_type;
    const record_id: any = subscription[0].id;
    console.log("record_id",record_id);

    await subscriptionsTable.destroy(record_id,function (error,deleteRecord) {
        if(error){
            console.log('error',error);
        }
        return res.send(customResponse('Subscription deleted successfully', 200, {}));
    });

    // const data = await subscriptionsTable.update(record_id, {
    //     "subscription_type": subscription_type ? subscription_type : alreadySubscribedType,
    //     "purchase_id": "",
    // }, (err: any, record: any) => {
    //     console.log("data of record", record);
    //     if (err) {
    //         console.log(err);
    //     }
    //     return res.send(customSubscriptionResponse('Subscription updated successfully.', 200, record.fields));
    // });
});

const port = app.get('port');
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

export default server;
