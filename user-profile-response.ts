
function userResponse(data: any) {
    const userObj = {
        id: data.id,
        name: data.name,
        email: data.email,
        social_token: data.social_token || '',
        phone_number: data.phone_number
    };
    return userObj;
}

export function customUserResponse(message:any,code:any,data: any) {
    const response = {
        message: message,
        code: code,
        data: userResponse(data)
    };
    return response;
}
