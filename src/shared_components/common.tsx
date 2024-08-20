import ErrorIcon from '@mui/icons-material/Error';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit/react';

interface ErrorProps {error:string|FetchBaseQueryError | SerializedError}

export const AppError:React.FC<ErrorProps> = ({error}) =>
    <div className='flex flex-row m-2 p-2 gap-2'>
        <ErrorIcon/>
        <p>{typeof error ==='string'?error:getErrorMsg(error)}</p>
    </div>

const getErrorMsg = (error:FetchBaseQueryError | SerializedError) => 
    'data' in error? JSON.stringify(error.data) : 'message' in error? error.message: error.toString()
