# react granular infinite scroll
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-0.1.0-orange)
![All Contributors](https://img.shields.io/badge/all_contributors-1-blue)

A React hook for implementing infinite scroll with granular control over the trigger point and fallback mechanism for fast scrolling scenarios.

## Features
- 🎯 Multiple ways to control scroll trigger points:
  - Preset percentage-based triggers (50%, 75%, 100%)
  - Automatic adaptation to growing list sizes
- 🔄 Built-in fallback mechanism for fast scrolling scenarios
- 📍 Precise control over scroll trigger positioning
- ⚙️ Customizable Intersection Observer options
- 🎚️ Dynamic trigger points that adapt to list growth
- 🏷️ Robust index tracking system
- 📱 Works with any scrollable container
- 🎨 Clean and simple API

## Usage

```jsx
import useFetchOnScroll from 'react-granular-infinite-scroll';;

const YourComponent = () => {
  const fetchMore = () => {
    // Your fetch logic here
  };

  const { ItemRef, fallbackRef, itemRefIndex, fallBackRefIndex } = useFetchOnScroll({
    fetchNext: fetchMore,
    numberOfItems: items.length,
    triggerPoint: "75%",  // Will be overridden if triggerIndex is provided
    triggerIndex: Math.floor(items.length / 7)  // Dynamic trigger point
  });

  return (
    <div>
      {items.map((item, index) => (
        <div 
          key={item.id}
          // data-id must be set to index for proper scroll tracking
          data-id={index}  
          ref={index === itemRefIndex ? ItemRef : index === fallBackRefIndex ? fallbackRef : null}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

## Important Implementation Notes

### Required Data Attribute

The hook relies on the `data-id` attribute to track item indexes during scrolling. When mapping through your items:

```jsx
// ✅ Correct implementation
{items.map((item, index) => (
  <div 
    key={item.id}
    data-id={index}  // Required: Must be set to the item's index
    ref={index === itemRefIndex ? ItemRef : index === fallBackRefIndex ? fallbackRef : null}
  >
    {item.content}
  </div>
))}

// ❌ Incorrect - missing data-id
{items.map((item, index) => (
  <div 
    key={item.id}
    ref={index === itemRefIndex ? ItemRef : index === fallBackRefIndex ? fallbackRef : null}
    
  >
    {item.content}
  </div>
))}
```


## Usage

```jsx
import useFetchOnScroll from 'react-granular-infinite-scroll';

const YourComponent = () => {
  const fetchMore = () => {
    // Your fetch logic here
  };

  const { ItemRef, fallbackRef, itemRefIndex, fallBackRefIndex } = useFetchOnScroll({
    fetchNext: fetchMore,
    numberOfItems: items.length,
    triggerPoint: "75%",  // Will be overridden if triggerIndex is provided
    triggerIndex: Math.floor(items.length / 7)  // Dynamic trigger point
  });

  return (
    <div>
      {items.map((item, index) => (
        <div 
          key={item.id}
          ref={index === itemRefIndex ? ItemRef : index === fallBackRefIndex ? fallbackRef : null}
          data-id={index}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

## Trigger Controls

### Dynamic Index-based Triggers

The `triggerIndex` prop offers superior granular control over scroll triggering by allowing dynamic index calculations. This enables you to:

1. Create custom percentage-based triggers beyond the standard options:
```jsx
// Trigger at exactly 33% of the list
useFetchOnScroll({
  numberOfItems: items.length,
  triggerIndex: Math.floor(items.length * 0.33)
});
```

2. Implement dynamic trigger points that adapt to list size:
```jsx
// Trigger point moves further down as list grows
useFetchOnScroll({
  numberOfItems: items.length,
  triggerIndex: Math.floor(items.length / 7)  // Every 7th portion of the list
});

// Example behavior:
// - With 14 items: triggers at index 2
// - With 35 items: triggers at index 5
// - With 70 items: triggers at index 10
```

3. Set precise trigger points based on business logic:
```jsx
// Combining multiple factors
useFetchOnScroll({
  numberOfItems: items.length,
  triggerIndex: calculateTriggerIndex({  // Example of a business logic function
    listLength: items.length,
    viewportHeight: window.innerHeight,
    itemHeight: 50
  })
});
```

### Priority and Override Behavior

⚠️ Important: When both `triggerIndex` and `triggerPoint` are provided, `triggerIndex` always takes precedence and completely overrides the percentage-based `triggerPoint`. This means:

```jsx
// triggerPoint will be ignored, fetch triggers at dynamic index
useFetchOnScroll({
  fetchNext: fetchMore,
  numberOfItems: items.length,
  triggerPoint: "75%",    // Ignored
  triggerIndex: Math.floor(items.length / 7)  // Takes effect
});
```

### Standard Percentage-based Triggers

If no `triggerIndex` is provided, the hook uses percentage-based triggers through the `triggerPoint` prop:

- `"50%"`: Triggers fetch when scrolling reaches halfway through the current items
- `"75%"`: Triggers fetch at three-quarters through the list
- `"100%"`: Traditional bottom-of-list trigger (default)


## Why Fallback Ref?

The fallback reference system is a crucial feature that handles edge cases where users scroll very rapidly through the content. In such scenarios:

1. The primary observer might miss the intersection event if the user scrolls too quickly past the trigger point
2. The fallback ref, always placed at the last item, ensures that the fetch trigger isn't missed
3. The hook maintains a session storage check to prevent duplicate fetches if both observers trigger


## Performance Recommendations

### Virtualization for Large Lists

When dealing with large lists (500+ items), it's strongly recommended to use this hook in combination with virtualization libraries:

```jsx
import useFetchOnScroll from 'react-granular-infinite-scroll';
import { FixedSizeList } from 'react-window';

const VirtualizedList = () => {
  const { ItemRef, fallbackRef, itemRefIndex, fallBackRefIndex } = useFetchOnScroll({
    fetchNext: fetchMore,
    numberOfItems: items.length,
    triggerIndex: Math.floor(items.length / 7)
  });

  const Row = ({ index, style }) => (
    <div 
      style={style}
      data-id={index}
      ref={index === itemRefIndex ? ItemRef : index === fallBackRefIndex ? fallbackRef : null}
    >
      {items[index].content}
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
};
```

Recommended virtualization libraries:
- `react-window`: Lightweight, modern virtualization library
- `react-virtualized`: Full-featured virtualization library with additional components


## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fetchNext` | `() => void` | Required | Function to call when more items need to be fetched |
| `fetchMore` | `boolean` | `true` | Flag to enable/disable fetch trigger |
| `numberOfItems` | `number` | Required | Total number of current items |
| `threshold` | `number` | `undefined` | Intersection Observer threshold |
| `rootMargin` | `string` | `undefined` | Intersection Observer root margin |
| `triggerPoint` | `"50%" \| "75%" \| "100%"` | `"100%"` | Point at which to trigger the fetch (ignored if triggerIndex is set) |
| `triggerIndex` | `number` | `undefined` | Specific item index to trigger fetch. Supports dynamic calculations and overrides triggerPoint when set |

### Returns

| Value | Type | Description |
|-------|------|-------------|
| `ItemRef` | `RefCallback` | Reference for the trigger point item |
| `fallbackRef` | `RefCallback` | Reference for the fallback (last) item |
| `itemRefIndex` | `number` | Index where the ItemRef should be placed |
| `fallBackRefIndex` | `number` | Index where the fallbackRef should be placed |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
