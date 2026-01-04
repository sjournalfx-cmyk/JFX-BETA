
import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  autosize?: boolean;
}

function TradingViewWidget({ 
  symbol = "IG:NASDAQ", 
  theme = "dark", 
  interval = "240", 
  autosize = true 
}: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget if it exists to allow updates
    if (container.current.childElementCount > 0) {
        container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetConfig = {
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": true,
      "hotlist": false,
      "interval": interval,
      "locale": "en",
      "save_image": true,
      "enable_publishing": false,
      "style": "1",
      "symbol": symbol,
      "theme": theme,
      "timezone": "Etc/UTC",
      "backgroundColor": theme === 'dark' ? "#09090b" : "#ffffff",
      "gridColor": theme === 'dark' ? "rgba(242, 242, 242, 0.06)" : "rgba(0, 0, 0, 0.06)",
      "withdateranges": true,
      "show_popup_button": true,
      "popup_height": "650",
      "popup_width": "1000",
      "autosize": autosize
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    const widgetContainer = document.createElement('div');
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "calc(100% - 32px)";
    widgetContainer.style.width = "100%";
    
    const copyright = document.createElement('div');
    copyright.className = "tradingview-widget-copyright";
    copyright.innerHTML = `<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Chart by TradingView</span></a>`;

    container.current.appendChild(widgetContainer);
    container.current.appendChild(copyright);
    container.current.appendChild(script);

  }, [symbol, theme, interval, autosize]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }} />
  );
}

export default memo(TradingViewWidget);
