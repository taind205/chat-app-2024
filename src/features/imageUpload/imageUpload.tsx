import { ChangeEvent, useEffect, useState } from 'react';
import ImageCrop from './imageCrop/imageCrop';
import { CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/utils/hook';

type AppImageUploadProps = {title:string, initImage?:string, onConfirmChange:(img:File)=>void, isUploading:boolean};
export const AppImageUpload: React.FC<AppImageUploadProps> = ({title,initImage,onConfirmChange,isUploading}) => {
    const [currentImage, setCurrentImage] = useState<File | null>(null);
    const dispatch = useAppDispatch();
    const [initImgState, setInitImgState] = useState('');
    
    useEffect(()=>{
        if(initImage) {
            console.log('initImage:',initImage)
            fetch(initImage).then((res) => res.blob()).then((myBlob) => {
                const myFile = new File([myBlob], 'image.jpeg', {type:myBlob.type});
                console.log('myblob: ',myBlob);
                console.log('myfile: ',myFile);
                console.log('blob type: ',myBlob.type)
                setInitImgState(URL.createObjectURL(myFile));
            });
        }
    },[initImage])

    return (
        <div className="flex flex-col gap-2 items-center">
            <p className="text-xl">{title}</p>
            <div className={currentImage?"hidden":"flex justify-center"}> 
                {initImgState && <ImageCrop setOutput={(image:File)=>setCurrentImage(image)} initImg={initImgState}/>}
                {!initImage && <ImageCrop setOutput={(image:File)=>setCurrentImage(image)} initImg={''}/>}
            </div>
            {currentImage && <>
                <img className="rounded-full" src={URL.createObjectURL(currentImage)} alt="Preview" style={{ height: '100px', width: '100px' }} />
                <div className='flex w-full justify-evenly gap-2'>
                    <button className='bg-slate-300 text-slate-800 p-2 rounded-xl ' 
                        onClick={()=>setCurrentImage(null)} disabled={isUploading}>
                        Edit image
                    </button>
                    <button className='bg-slate-300 text-slate-800 gap-2 p-2 rounded-xl ' 
                        onClick={()=>onConfirmChange(currentImage)} disabled={isUploading}>
                        {isUploading && <CircularProgress size={16}/>}
                        Confirm change
                    </button>
                </div>
            </>
            }
        </div>
    );
};