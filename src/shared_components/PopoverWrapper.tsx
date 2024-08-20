import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface WrapperProps {popover:ReactNode, onClick?:(e:React.MouseEvent)=>void, children:ReactNode};

export const PopoverWrapper:React.FC<WrapperProps> = ({children, popover, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
   const triggerBtn_Ref=useRef<HTMLButtonElement>(null);
    
  const handleTogglePopover = () => {
    setIsOpen(!isOpen);
  };

  const handleClick = (e:React.MouseEvent) => {
      onClick?.(e);
      handleTogglePopover();
  };

  return (<>
        <button ref={triggerBtn_Ref} className='contents' onClick={handleClick}>{children}</button>  
        {createPortal(
            <>{isOpen && <Popover content={popover} onClose={() => setIsOpen(false)} triggerBtn_Ref={triggerBtn_Ref}/> 
            }</>,
                document.body
            )}
    </>
  );
};

interface PopoverProps {
    content:React.ReactNode, onClose:()=>void, triggerBtn_Ref:React.RefObject<HTMLButtonElement>,
}

const Popover:React.FC<PopoverProps> = ({content, onClose, triggerBtn_Ref}) => {
    console.log('popover is rendering...')
    const [isDisplay, setIsDisplay] = useState(false);
    const popoverDivRef = useRef<HTMLDivElement>(null);
    const top_Ref = useRef(0);
    const left_Ref = useRef(0);
    const prevPos_Ref = useRef<{x:number,y:number}|undefined>(undefined);
   
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        const timerId = setInterval(checkElementPositions, 500);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            clearInterval(timerId); 
        };
    }, []);
    const checkElementPositions = () => {
        const btnPos = getTriggerBtnCenterPosition();
        console.log('checking pos',prevPos_Ref.current,btnPos);
        if(!prevPos_Ref.current) prevPos_Ref.current=btnPos;
        else if(prevPos_Ref.current.y!=btnPos.y||prevPos_Ref.current.x!=btnPos.x) onClose();
    };
    const handleClickOutside = (e: MouseEvent) => (popoverDivRef.current && !popoverDivRef.current.contains(e.target as Node)) ? onClose() : false;

    useEffect(() => { //After the popover is open, calculate the new position, this cause a bit delay in displaying at correct position(fix with isDisplay)
        const btnPos = getTriggerBtnCenterPosition();
        left_Ref.current = getPopoverRelativeLeft(popoverDivRef.current?.offsetWidth || 0, 8, btnPos.x);
        top_Ref.current = getPopoverRelativeTop(popoverDivRef.current?.offsetHeight || 0, 12, btnPos.y);
        setIsDisplay(true);
    }, []);
    
    const getTriggerBtnCenterPosition = () => {
        console.log('get btn pos...');
        if (!triggerBtn_Ref.current) return {x:0,y:0};
    
        const rect = triggerBtn_Ref.current.getClientRects()[0];
    
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
        
        console.log("get x,y:",centerX,centerY);
    
        return { x: centerX, y: centerY };
      };

    return( 
        <div ref={popoverDivRef} style={{ left: left_Ref.current, top: top_Ref.current, visibility:isDisplay?"visible":"hidden", maxWidth:'90vw' }}
                className="absolute rounded-xl bg-slate-600 z-20">
                {content}
            </div>
    )
}

const getPopoverRelativeLeft = (popoverWidth: number, padding: number, posX: number, parentBCR?: DOMRect) => {
    // Get CSS left property of popover in relative to the view for correct display.

    console.log('##### called getPopoverRelativeLeft');
    const parentLeft = parentBCR?.left || 0;
    const parentRight = parentBCR?.right || window.innerWidth;
    const parentSize = parentRight - parentLeft;
    const DLeft = posX - parentLeft;
    const DRight = parentRight - posX;
    if (DLeft < (popoverWidth / 2 + padding)) return padding;
    else if (DRight < (popoverWidth / 2 + padding)) return parentSize - padding - popoverWidth;
    else return DLeft - (popoverWidth / 2);
}

const getPopoverRelativeTop = (popoverHeight: number, padding: number, posY: number, parentBCR?: DOMRect) => {
    // Get CSS top property of popover in relative to the view for correct display.

    console.log('##### called getPopoverRelativeTop',popoverHeight,window.innerHeight);
    const parentTop = parentBCR?.top || 0;
    const parentBot = parentBCR?.bottom || window.innerHeight;
    const parentSize = parentBot - parentTop;
    const DTop = posY - parentTop;
    const DBot = parentBot - posY;
    if (DBot > (popoverHeight + padding)) return DTop + padding;
    else return DTop - (padding + popoverHeight);
}

export default PopoverWrapper;