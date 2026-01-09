/**
 * Analytics Utility - Custom localStorage-based tracking
 * Privacy-friendly analytics without external dependencies
 */

export interface AnalyticsEvent {
    type: string;
    properties?: Record<string, any>;
    timestamp: number;
}

export interface AnalyticsSession {
    sessionId: string;
    startTime: number;
    events: AnalyticsEvent[];
    pageViews: number;
    referrer: string;
}

class Analytics {
    private sessionKey = 'uds_analytics_session';
    private eventsKey = 'uds_analytics_events';
    private session: AnalyticsSession | null = null;

    constructor() {
        this.initSession();
    }

    private initSession(): void {
        const existingSession = localStorage.getItem(this.sessionKey);

        if (existingSession) {
            try {
                this.session = JSON.parse(existingSession);
            } catch (e) {
                this.createNewSession();
            }
        } else {
            this.createNewSession();
        }
    }

    private createNewSession(): void {
        this.session = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            events: [],
            pageViews: 0,
            referrer: document.referrer || 'direct'
        };
        this.saveSession();
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private saveSession(): void {
        if (this.session) {
            localStorage.setItem(this.sessionKey, JSON.stringify(this.session));
        }
    }

    private saveEvent(event: AnalyticsEvent): void {
        const events = this.getEvents();
        events.push(event);

        // Keep only last 100 events to prevent localStorage overflow
        const recentEvents = events.slice(-100);
        localStorage.setItem(this.eventsKey, JSON.stringify(recentEvents));
    }

    private getEvents(): AnalyticsEvent[] {
        try {
            const events = localStorage.getItem(this.eventsKey);
            return events ? JSON.parse(events) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Track a custom event
     */
    trackEvent(type: string, properties?: Record<string, any>): void {
        const event: AnalyticsEvent = {
            type,
            properties: {
                ...properties,
                sessionId: this.session?.sessionId,
                page: window.location.pathname
            },
            timestamp: Date.now()
        };

        if (this.session) {
            this.session.events.push(event);
            this.saveSession();
        }

        this.saveEvent(event);

        // Log to console in development
        if (import.meta.env.DEV) {
            console.log('📊 Analytics Event:', event);
        }
    }

    /**
     * Track page view
     */
    trackPageView(path?: string): void {
        const page = path || window.location.pathname;

        if (this.session) {
            this.session.pageViews++;
            this.saveSession();
        }

        this.trackEvent('page_view', { path: page });
    }

    /**
     * Track CTA button click
     */
    trackCTAClick(button: string, location: string): void {
        this.trackEvent('cta_click', { button, location });
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth(depth: number): void {
        const depthPercentage = Math.round(depth * 100);
        this.trackEvent('scroll_depth', { depth: `${depthPercentage}%` });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage(duration: number): void {
        this.trackEvent('time_on_page', { duration });
    }

    /**
     * Track conversion (simulator launch)
     */
    trackConversion(source: string): void {
        this.trackEvent('conversion', { source, type: 'simulator_launch' });
    }

    /**
     * Get analytics summary for reporting
     */
    getAnalyticsSummary(): {
        totalEvents: number;
        totalPageViews: number;
        sessionDuration: number;
        topEvents: Array<{ type: string; count: number }>;
    } {
        const events = this.getEvents();
        const sessionDuration = this.session
            ? Date.now() - this.session.startTime
            : 0;

        // Count event types
        const eventCounts = events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topEvents = Object.entries(eventCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalEvents: events.length,
            totalPageViews: this.session?.pageViews || 0,
            sessionDuration,
            topEvents
        };
    }

    /**
     * Clear analytics data
     */
    clearAnalytics(): void {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.eventsKey);
        this.createNewSession();
    }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackEvent = (type: string, properties?: Record<string, any>) =>
    analytics.trackEvent(type, properties);

export const trackPageView = (path?: string) =>
    analytics.trackPageView(path);

export const trackCTAClick = (button: string, location: string) =>
    analytics.trackCTAClick(button, location);

export const trackScrollDepth = (depth: number) =>
    analytics.trackScrollDepth(depth);

export const trackTimeOnPage = (duration: number) =>
    analytics.trackTimeOnPage(duration);

export const trackConversion = (source: string) =>
    analytics.trackConversion(source);

export const getAnalyticsSummary = () =>
    analytics.getAnalyticsSummary();
