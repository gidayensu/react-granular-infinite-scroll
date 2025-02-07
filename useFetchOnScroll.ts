
import { RefObject, useCallback, useMemo, useRef } from "react";

export type TriggerPoint = "50%" | "75%" | "100%";

export interface FetchOnScrollProps {
  fetchNext: () => void;
  fetchMore?: boolean;
  numberOfItems: number;
  threshold?: number;
  rootMargin?: string;
  triggerPoint?: TriggerPoint;
  triggerIndex?: number
}

const getTriggerPointValue = (
  triggerPoint: TriggerPoint,
  numberOfItems: number
) => {
  const triggerValues: { [key: string]: number } = {
    "50%": Math.floor(numberOfItems * 0.5),
    "75%": Math.floor(numberOfItems * 0.75),
    "100%": numberOfItems - 1,
  };
  return triggerValues[triggerPoint];
};

const useFetchOnScroll = ({
  fetchNext,
  fetchMore = true,
  numberOfItems,
  threshold,
  rootMargin,
  triggerPoint = "100%",
  triggerIndex
}: FetchOnScrollProps) => {

  let ItemObserver = useRef<IntersectionObserver | null>(null);
  const fallbackObserver = useRef<IntersectionObserver | null>(null);
  const fallBackRefIndex = numberOfItems - 1;
  const lastItemIndex = useRef<number | null>(null)
  
  if (triggerPoint === "100%" || triggerIndex === fallBackRefIndex || (!triggerPoint && !triggerIndex)) {    // Assign the item observer to the fallback observer if the trigger point or index matches the fallback index, or if neither is provided.
    ItemObserver = fallbackObserver;
  }


 let itemRefIndex = useMemo(
   () => getTriggerPointValue(triggerPoint, numberOfItems),
   [numberOfItems, triggerPoint]
 );

  if(triggerIndex) {
    itemRefIndex = Math.floor(triggerIndex)
  }

  const fetchOnScroll = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries.length === 0) {
        return;
      }
      if (entries[0].isIntersecting && fetchMore) {
        const entryId = parseInt(entries[0].target.getAttribute("data-id") as string);

        if (entryId === itemRefIndex) {
          lastItemIndex.current = entryId
          fetchNext();
        }

        if (
          entryId === fallBackRefIndex &&
          lastItemIndex.current !== itemRefIndex
        ) {
          fetchNext();
        }
      }
    },
    [fetchNext, fetchMore, itemRefIndex, fallBackRefIndex]
  );
  

  const useIntersectionObserver = (
    observerRef: RefObject<IntersectionObserver | null>,
    iOCallback: IntersectionObserverCallback
  ) => {
    return useCallback(
      (node: HTMLElement | null) => {
        if (!node) {
          return;
        }

        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        const observer = new IntersectionObserver(iOCallback, {
          threshold,
          rootMargin,
        });

        observerRef.current = observer;
        observer.observe(node);

        return () => {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
      },
      [observerRef, iOCallback]
    );
  };

  const itemRef = useIntersectionObserver(ItemObserver, fetchOnScroll);
  const fallbackRef = useIntersectionObserver(fallbackObserver, fetchOnScroll);


  
  return { itemRef, fallbackRef, itemRefIndex, fallBackRefIndex };
};

export default useFetchOnScroll;
