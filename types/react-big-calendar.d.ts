declare module "react-big-calendar" {
  export const Calendar: any
  export function dateFnsLocalizer(config: any): any
}

declare module "react-big-calendar/lib/localizers/date-fns" {
  const dateFnsLocalizer: (config: {
    format: (...args: any[]) => string;
    parse: (...args: any[]) => Date;
    startOfWeek: (...args: any[]) => Date;
    getDay: (...args: any[]) => number;
    locales: Record<string, Locale>;
  }) => any;
  export default dateFnsLocalizer;
}
