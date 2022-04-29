
function userResponse(data: any) {
    return {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        social_token: data.social_token || '',
        phone_number: data.phone_number || ''
    };
}
function subscriptionResponse(data: any) {
    const userId = data['id (from user_id)'];
    return {
        id: data.id,
        user_id: data.user_id[0] || '',
        user: userId[0],
        subscription_plan: data.subscription_plan || '',
        subscription_type: data.subscription_type || '',
        status: data.status || false,
        created_at: data.created_at || '',
    };
}

export function customUserResponse(message:any,code:any,data: any) {
    return {
        message: message,
        code: code,
        data: userResponse(data)
    };
}

export function customResponse(message:any,code:any,data: any) {
    return {
        message: message,
        code: code,
        data: data
    };
}
export function customSubscriptionResponse(message:any,code:any,data:any){
    return {
        message: message,
        code: code,
        data: subscriptionResponse(data)
    };
}