import Resizer from "react-image-file-resizer";

export type ResolvedImageType = string | File | Blob | ProgressEvent<FileReader>;
export const resizeFile:(file:File|Blob)=>Promise<ResolvedImageType> = (file: File|Blob) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      800,
      800,
      "JPEG",
      70,
      0,
      (uri) => {
        resolve(uri);
      },
      "blob"
    );
  });

export function getDateFromObjId(objId: string|undefined): Date|undefined {
    return objId? new Date(parseInt(objId.substring(0, 8), 16) * 1000):undefined;
}

export const debounce = (func:Function, delay: number=300, initFunc?:Function) => {
    let timeout: NodeJS.Timeout;
    return (...args: unknown[]) => {
      clearTimeout(timeout);
      initFunc?.apply(this, args);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

export function deduplicateById<T extends HasId>(array: T[], dupIdArray: T[]) {
    // Create a set from the IDs in array1 for efficient lookups
    const uniqueIds = new Set(dupIdArray.map(v => v.id));
  
    return array.filter(v => !uniqueIds.has(v.id));
  }

  // Return a new array with array1 following by id-deduplicated array2.
export function deduplicateByIdAndUnshiftNew<T extends HasId>(array1: T[], array2: T[]) {
  // Create a set from the IDs in array1 for efficient lookups
  const uniqueIds = new Set(array1.map(v => v.id));

  return array1.concat(array2.filter(v => !uniqueIds.has(v.id)));
}

export function findAndMergeById<T extends HasObjectId>(array: T[], element: T, notFound?:()=>void) {
  const index = array.findIndex(element => element._id === element._id);
  if (index !== -1) {
    array.splice(index, 1, {...array[index], ...element});
    return true;
  }
  else notFound?notFound():false;
}

export function deduplicateByObjIdAndUnshiftNew<T extends HasObjectId>(newArray: T[], existArray: T[]) {
  // Create a set from the IDs in array1 for efficient lookups
  const uniqueIds = new Set(newArray.map(v => v._id));

  return newArray.concat(existArray.filter(v => !uniqueIds.has(v._id)));
}

export function mergeArraysById<T extends HasObjectId>(newArray:T[], oldArray:T[]) {
  const mergedArray:T[] = [];
  const oldMap = new Map();

  // Create a map of old elements for efficient lookup
  for (const element of oldArray) {
    oldMap.set(element._id, element);
  }

  // Loop through the new array
  for (const newElement of newArray) {
    const oldElement = oldMap.get(newElement._id);

    // If element exists in old array, merge properties
    if (oldElement) {
      mergedArray.push({ ...oldElement, ...newElement });
    } else {
      // If element is new, add it directly
      mergedArray.push(newElement);
    }
  }

  // Add remaining elements from the old array (if any)
  for (const element of oldArray) {
    if (!mergedArray.find(item => item._id === element._id)) {
      mergedArray.push(element);
    }
  }

  return mergedArray;
}
type HasId = { id: string | number} 

type HasObjectId = { _id:string; };
  
export function mergeWithUniqueObjIds<T extends HasObjectId>(array:T[], priorityArray:T[]) {
  const map = new Map<string | number, T>();
  for (const e of array) {
    map.set(e._id, e);
  }
  for (const e of priorityArray) {
    map.set(e._id, e);
  }
  return Array.from(map.values());
}

export function removeUndefinedProperties<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

export function getShortPastTime(date: Date|undefined): string|undefined {
  if(!date) return undefined
  const diffTime = (Date.now() - date.getTime()) / 1000;
  if(diffTime < 60) return "0m"
  else if (diffTime < 3600)
      return Math.ceil(diffTime / 60) + "m"
  else if (diffTime < (60 * 60 * 24))
      return Math.floor(diffTime / 60 / 60) + "h"
  else return undefined;
}

export function getPastTime(date: Date|undefined): string|undefined {
  if(!date) return undefined
  const diffTime = (Date.now() - date.getTime()) / 1000;
  if (diffTime < 3600)
      return Math.ceil(diffTime / 60) + " min"
  else if (diffTime < (60 * 60 * 24))
      return Math.floor(diffTime / 60 / 60) + " hour"
  else if (diffTime < (60 * 60 * 24 * 7))
      return Math.floor(diffTime / 60 / 60 / 24) + " day"
  else if (diffTime < (60 * 60 * 24 * 7 * 52))
      return Math.floor(diffTime / 60 / 60 / 24 / 7) + " week"
  else return Math.floor(diffTime / 60 / 60 / 24 / 7 / 52) + " year"
}  

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}