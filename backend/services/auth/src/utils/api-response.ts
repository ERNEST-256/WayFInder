import type { Response } from "express";

interface ApiSuccessOptions<T>{
    statusCode?: number;
    message: string;
    data: T;
}

export function sendSuccess <T>(res: Response, options: ApiSuccessOptions<T>) {
    const {statusCode = 200 , message , data} = options;

   if( !Number.isInteger(statusCode)|| statusCode > 300 || statusCode <200 || statusCode == 204 ){

    throw new RangeError("Invalid status code");

    }

    const requestId =
            typeof res.locals.requestId === "string"
            ? res.locals.requestId 
            : null ;

    return res.status(statusCode).json({
        success : true ,
        message ,
        data ,
        requestId,
     })
 }
