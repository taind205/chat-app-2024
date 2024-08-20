import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {tooltip:ReactNode, children:ReactNode, className?:string};

const TooltipWrapper:React.FC<Props> = ({children, tooltip, className}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isMouseIn_Ref = useRef(false);
    const triggerDivRef = useRef<HTMLDivElement>(null);
    
    const openTooltip = () => {
        isMouseIn_Ref.current==true && setIsOpen(true);
    }

    const handleMouseLeave = (e:React.MouseEvent) => {
    isMouseIn_Ref.current=false;
    setIsOpen(false)
  };

    const handleMouseEnter = (e:React.MouseEvent) => {
    isMouseIn_Ref.current=true;
    setTimeout(openTooltip,500);
  };

  return (<>
        <div ref={triggerDivRef} className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </div>  
        {createPortal(<>{isOpen && <Tooltip content={tooltip} triggerDivRef={triggerDivRef} onClose={()=>setIsOpen(false)}/>}</>,
                document.body
            )}
    </>
  );
};

interface TooltipProps {content:ReactNode|string, triggerDivRef:React.RefObject<HTMLDivElement>, onClose: ()=>void};

const Tooltip:React.FC<TooltipProps> = ({content,triggerDivRef,onClose}) =>{
    const [isDisplay, setIsDisplay] = useState(false);
    const tooltipDivRef = useRef<HTMLDivElement>(null);
    const top_Ref = useRef(0);
    const left_Ref = useRef(0);
    const prevPos_Ref = useRef<{x:number,y:number}|undefined>(undefined);

    useEffect(() => { //After the tooltip is open, calculate the new position, this cause a bit delay in displaying at correct position(fix with isDisplay)
      const timerId = setInterval(checkElementPositions, 500);
      const divPos = getTriggerDivCenterPosition();
      left_Ref.current = getTooltipRelativeLeft(tooltipDivRef.current?.offsetWidth || 0, divPos.x, 8);
      top_Ref.current = getTooltipRelativeTop(tooltipDivRef.current?.offsetHeight || 0,  divPos.y, 12, divPos.height);
      setIsDisplay(true);
      return () => {
        clearInterval(timerId); 
    };
    }, []);

    const checkElementPositions = () => {
      const divPos = getTriggerDivCenterPosition();
      if(!prevPos_Ref.current) prevPos_Ref.current=divPos;
      else if(prevPos_Ref.current.y!=divPos.y||prevPos_Ref.current.x!=divPos.x) onClose();

  };

    const getTriggerDivCenterPosition = () => {
        if (!triggerDivRef.current) return {x:0,y:0};
    
        const rect = triggerDivRef.current.getClientRects()[0];
    
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
    
        return { x: centerX, y: centerY, height:rect.height };
      };

  return( 
    <div ref={tooltipDivRef} style={{ left: left_Ref.current, top: top_Ref.current, 
        visibility:isDisplay?"visible":"hidden", maxWidth:'90vw', zIndex:50 }}
        className="absolute rounded-xl bg-slate-600 py-0.5 px-2">
        {typeof content ==='string'? <p className='text-sm'>{content}</p>
        :content}
    </div>
  )

}

const getTooltipRelativeLeft = (tooltipWidth: number, posX: number, padding: number, parentBCR?: DOMRect) => {
    const parentLeft = parentBCR?.left || 0;
    const parentRight = parentBCR?.right || window.innerWidth;
    const parentSize = parentRight - parentLeft;
    const DLeft = posX - parentLeft;
    const DRight = parentRight - posX;
    if (DLeft < (tooltipWidth / 2 + padding)) return padding;
    else if (DRight < (tooltipWidth / 2 + padding)) return parentSize - padding - tooltipWidth;
    else return DLeft - (tooltipWidth / 2);
}

const getTooltipRelativeTop = (tooltipHeight: number, posY: number, padding: number, elementHeight?:number, parentBCR?: DOMRect) => {
    const halfHeight = (elementHeight||0)/2;
    const parentTop = parentBCR?.top || 0;
    const parentBot = parentBCR?.bottom || window.innerHeight;
    const parentSize = parentBot - parentTop;
    const DTop = posY - parentTop; //Distance from posY to the top of screen
    const DBot = parentBot - posY; //Distance from posY to the bottom of screen
    if (DBot > (tooltipHeight + padding*2 + halfHeight)) return DTop + padding + halfHeight;
    else return DTop - (padding + tooltipHeight + halfHeight);
}

export default TooltipWrapper;