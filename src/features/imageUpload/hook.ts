import { resizeFile } from "@/utils/helperFunction";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

export function useImageInput() {
    const [images, setImages] = useState<File[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openImageInput = () => { // Trigger file input click on button click
        fileInputRef.current?.click();
    };
  
    const handleImageChange =  async (e:ChangeEvent<HTMLInputElement>) => {
        let resized:File[]= await Promise.all(Array.from(e.target.files||[]).map(async v => await resizeFile(v) as File));
        setImages([...images, ...resized]);
    };
    
    const removeImage = useCallback((index:number) => {
        console.time('remove');
        setImages(images.filter((v,i)=>i!=index))
        console.timeEnd('remove');
    },[])

    const clearImages = useCallback(() => {
      setImages([])
  },[images])
  
    // Function to handle upload errors
    const handleImageUploadError = (error: Error) => {
      // Handle upload errors (e.g., display error message)
    };
  
    return { handleImageChange, handleImageUploadError, removeImage, images, fileInputRef, openImageInput, clearImages }; // Return relevant functions
  }