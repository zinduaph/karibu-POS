const getMpesaConfig = () => {
    const {
        MPESA_CONSUMER_KEY,
        MPESA_CONSUMER_SECRET,
        MPESA_SHORTCODE,
        MPESA_PASSKEY,
        MPESA_CALLBACK_URL
    } = process.env

    const missing = Object.entries({
        MPESA_CONSUMER_KEY,
        MPESA_CONSUMER_SECRET,
        MPESA_SHORTCODE,
        MPESA_PASSKEY,
        MPESA_CALLBACK_URL
    }).filter(([, value]) => !value).map(([name]) => name)

    if(missing.length){
        throw new Error(`Missing M-Pesa configuration: ${missing.join(', ')}`)
    }

    const environment = process.env.MPESA_ENV || 'sandbox'
    if(!['sandbox', 'production'].includes(environment)){
        throw new Error('MPESA_ENV must be sandbox or production')
    }

    let callbackUrl
    try{
        callbackUrl = new URL(MPESA_CALLBACK_URL)
    }catch{
        throw new Error('MPESA_CALLBACK_URL must be a valid absolute URL')
    }

    if(environment === 'production' && callbackUrl.protocol !== 'https:'){
        throw new Error('MPESA_CALLBACK_URL must use HTTPS in production')
    }

    return {
        consumerKey:MPESA_CONSUMER_KEY,
        consumerSecret:MPESA_CONSUMER_SECRET,
        shortcode:MPESA_SHORTCODE,
        passkey:MPESA_PASSKEY,
        callbackUrl:callbackUrl.toString(),
        transactionType:process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
        apiBase:environment === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke'
    }
}

export const assertMpesaConfigured = () => {
    getMpesaConfig()
}

export const normalizeKenyanPhone = value => {
    if(typeof value !== 'string' && typeof value !== 'number'){
        throw new Error('A valid Kenyan M-Pesa phone number is required')
    }

    let phone = String(value).replace(/[\s()-]/g, '')
    if(phone.startsWith('+')){
        phone = phone.slice(1)
    }
    if(phone.startsWith('0')){
        phone = `254${phone.slice(1)}`
    }

    if(!/^254(?:7|1)\d{8}$/.test(phone)){
        throw new Error('Phone number must be a valid Kenyan number, e.g. 0712345678')
    }
    return phone
}

const getAccessToken = async config => {
    const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
    const response = await fetch(`${config.apiBase}/oauth/v1/generate?grant_type=client_credentials`, {
        headers:{Authorization:`Basic ${credentials}`},
        signal:AbortSignal.timeout(15000)
    })

    const body = await response.json()
    if(!response.ok || !body.access_token){
        const error = new Error(`M-Pesa OAuth request failed (${response.status})`)
        error.paymentOutcome = 'rejected'
        throw error
    }
    return body.access_token
}

const getTimestamp = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone:'Africa/Nairobi',
        year:'numeric',
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit',
        hourCycle:'h23'
    }).formatToParts(new Date())
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`
}

export const initiateStkPush = async ({phoneNumber, amount, accountReference}) => {
    const config = getMpesaConfig()
    let accessToken
    try{
        accessToken = await getAccessToken(config)
    }catch(error){
        error.paymentOutcome = 'rejected'
        throw error
    }
    const timestamp = getTimestamp()
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64')

    let response
    try{
        response = await fetch(`${config.apiBase}/mpesa/stkpush/v1/processrequest`, {
            method:'POST',
            headers:{
                Authorization:`Bearer ${accessToken}`,
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                BusinessShortCode:config.shortcode,
                Password:password,
                Timestamp:timestamp,
                TransactionType:config.transactionType,
                Amount:amount,
                PartyA:phoneNumber,
                PartyB:config.shortcode,
                PhoneNumber:phoneNumber,
                CallBackURL:config.callbackUrl,
                AccountReference:accountReference.slice(0, 12),
                TransactionDesc:'POS sale'
            }),
            signal:AbortSignal.timeout(15000)
        })
    }catch(error){
        error.paymentOutcome = 'unknown'
        throw error
    }

    let body
    try{
        body = await response.json()
    }catch(error){
        error.paymentOutcome = 'unknown'
        throw error
    }
    if(!response.ok || body.ResponseCode !== '0' || !body.CheckoutRequestID){
        const error = new Error(`M-Pesa STK Push failed (${response.status}): ${body.errorMessage || body.ResponseDescription || 'Unexpected response'}`)
        error.paymentOutcome = response.status >= 400 && response.status < 500 || body.ResponseCode && body.ResponseCode !== '0'
            ? 'rejected'
            : 'unknown'
        throw error
    }
    return body
}
