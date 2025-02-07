import { renderHook } from '@testing-library/react';  
import { act } from '@testing-library/react';
import useFetchOnScroll, { FetchOnScrollProps } from '../useFetchOnScroll';

// Mock IntersectionObserver
class MockIntersectionObserver implements Omit<IntersectionObserver, 'root'> {
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit;
  observedElements: Element[];
  
  // Required IntersectionObserver properties with correct types
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    this.observedElements = [];
    
    // Initialize required properties
    this.root = options.root || null;
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = Array.isArray(options.threshold) 
      ? options.threshold 
      : [options.threshold || 0];
  }

  observe(element: Element): void {
    this.observedElements.push(element);
  }

  unobserve(element: Element): void {
    this.observedElements = this.observedElements.filter(el => el !== element);
  }

  disconnect(): void {
    this.observedElements = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Helper method to simulate intersection
  simulateIntersection(isIntersecting: boolean, dataId: string) {
    const element = document.createElement('div');
    element.setAttribute('data-id', dataId);
    
    this.callback([
      {
        isIntersecting,
        target: element,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 0,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0
      }
    ], this);
  }
}


let mockIntersectionObserver: MockIntersectionObserver;
global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => {
  mockIntersectionObserver = new MockIntersectionObserver(callback, options);
  return mockIntersectionObserver;
});

describe('useFetchOnScroll', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createDefaultProps = (overrides?: Partial<FetchOnScrollProps>): FetchOnScrollProps => ({
    fetchNext: jest.fn(),
    numberOfItems: 10,
    fetchMore: true,
    ...overrides
  });

  it('should initialize with default values', () => {
    const props = createDefaultProps();
    const { result } = renderHook(() => useFetchOnScroll(props));

    expect(result.current.itemRefIndex).toBe(9); // 100% trigger point
    expect(result.current.fallBackRefIndex).toBe(9);
    expect(typeof result.current.itemRef).toBe('function');
    expect(typeof result.current.fallbackRef).toBe('function');
  });

  it('should calculate correct trigger points', () => {
    const testCases = [
      { triggerPoint: '50%', expectedIndex: 5 },
      { triggerPoint: '75%', expectedIndex: 7 },
      { triggerPoint: '100%', expectedIndex: 9 }
    ] as const;

    testCases.forEach(({ triggerPoint, expectedIndex }) => {
      const props = createDefaultProps({ triggerPoint });
      const { result } = renderHook(() => useFetchOnScroll(props));
      expect(result.current.itemRefIndex).toBe(expectedIndex);
    });
  });

  it('should respect custom triggerIndex', () => {
    const props = createDefaultProps({ triggerIndex: 3 });
    const { result } = renderHook(() => useFetchOnScroll(props));
    expect(result.current.itemRefIndex).toBe(3);
  });

  it('should call fetchNext when trigger point is intersected', () => {
    const fetchNext = jest.fn();
    const props = createDefaultProps({ fetchNext });
    
    const { result } = renderHook(() => useFetchOnScroll(props));
    
    
    const mockNode = document.createElement('div');
    act(() => {
      result.current.itemRef(mockNode);
    });

    
    act(() => {
      mockIntersectionObserver.simulateIntersection(true, '9');
    });

    expect(fetchNext).toHaveBeenCalledTimes(1);
  });

  it('should not call fetchNext when fetchMore is false', () => {
    const fetchNext = jest.fn();
    const props = createDefaultProps({ fetchNext, fetchMore: false });
    
    const { result } = renderHook(() => useFetchOnScroll(props));
    
    const mockNode = document.createElement('div');
    act(() => {
      result.current.itemRef(mockNode);
    });

    act(() => {
      mockIntersectionObserver.simulateIntersection(true, '9');
    });

    expect(fetchNext).not.toHaveBeenCalled();
  });

  it('should handle fallback observer correctly', () => {
    const fetchNext = jest.fn();
    const props = createDefaultProps({ 
      fetchNext,
      triggerPoint: '75%',
      numberOfItems: 10
    });
    
    const { result } = renderHook(() => useFetchOnScroll(props));
    
    
    const mockItemNode = document.createElement('div');
    const mockFallbackNode = document.createElement('div');
    
    act(() => {
      result.current.itemRef(mockItemNode);
      result.current.fallbackRef(mockFallbackNode);
    });

    
    act(() => {
      mockIntersectionObserver.simulateIntersection(true, '9');
    });

    expect(fetchNext).toHaveBeenCalledTimes(1);
  });

  it('should cleanup observers when unmounted', () => {
    const props = createDefaultProps();
    const { result, unmount } = renderHook(() => useFetchOnScroll(props));
    
    const mockNode = document.createElement('div');
    act(() => {
      result.current.itemRef(mockNode);
    });

    const disconnectSpy = jest.spyOn(mockIntersectionObserver, 'disconnect');
    
    unmount();
    
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should handle null node refs correctly', () => {
    const props = createDefaultProps();
    const { result } = renderHook(() => useFetchOnScroll(props));
    
    expect(() => {
      act(() => {
        result.current.itemRef(null);
      });
    }).not.toThrow();
  });

  it('should respect custom threshold and rootMargin', () => {
    const threshold = 0.5;
    const rootMargin = '10px';
    const props = createDefaultProps({ threshold, rootMargin });
    
    const { result } = renderHook(() => useFetchOnScroll(props));
    
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
        rootMargin: '10px'
      })
    );
  });
});