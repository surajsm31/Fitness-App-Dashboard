import React, { useState } from 'react';

const LazyImage = ({ src, alt, className = '', placeholderClassName = '' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    console.log('LazyImage - src:', src, 'isLoaded:', isLoaded, 'hasError:', hasError);

    const handleLoad = (e) => {
        console.log('Image loaded successfully:', src);
        setIsLoaded(true);
    };

    const handleError = (e) => {
        console.log('Image failed to load:', src);
        setHasError(true);
    };

    // Show error state
    if (hasError) {
        return (
            <div className={`${placeholderClassName} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
                <div className="w-4 h-4 text-gray-400">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* Show skeleton while loading */}
            {!isLoaded && (
                <div className={`${placeholderClassName} animate-pulse bg-gray-200 dark:bg-gray-700 flex items-center justify-center absolute inset-0 z-10`}>
                    <div className="w-4 h-4 text-gray-400">
                        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
            
            {/* Actual image */}
            <img
                src={src}
                alt={alt}
                className={`${className} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default LazyImage;
