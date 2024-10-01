import { HomeAssistant } from 'custom-card-helpers';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    css,
    CSSResult,
    html,
    LitElement,
    PropertyValues,
    TemplateResult,
} from 'lit';
import {
    customElement,
    property,
    state,
} from 'lit/decorators';
import { DateTime } from 'luxon';

import { CARD_VERSION } from './const';
import IDigitalClockConfig from './IDigitalClockConfig';

/* eslint no-console: 0 */
console.info(
    `%c  Digital-Clock \n%c  Version ${CARD_VERSION}    `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'digital-clock-mm2large',
    name: 'DigitalClockMM2Large',
    description: 'A digital clock component',
});

@customElement('digital-clock-mm2large')
export class DigitalClockMM2Large extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;
    @state() private _firstLine = '';
    @state() private _meridiem = '';
    @state() private _seconds = '';
    @state() private _secondLine = '';
    @state() private _config?: IDigitalClockConfig;
    @state() private _interval = 1000;
    private _intervalId?: number;

    public setConfig(config: IDigitalClockConfig): void {
        this._config = { ...config };
        if (this._config.timeFormat)
            this._config.firstLineFormat = this._config.timeFormat;
        if (this._config.dateFormat)
            this._config.secondLineFormat = this._config.dateFormat;
        if (this._config.interval !== this._interval)
            this._interval = this._config.interval ?? 1000;
    }

    protected shouldUpdate(changedProps: PropertyValues): boolean {
        return changedProps.has('_firstLine') || changedProps.has('_seconds') || changedProps.has('_meridiem') || changedProps.has('_secondLine') || changedProps.has('_config') || changedProps.has('hass');
    }

    public async getCardSize(): Promise<number> {
        return 3;
    }

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);

        if (changedProperties.has('_interval')) {
            this._stopInterval();
            this._startInterval();
        }
        if (changedProperties.has('_config'))
            this._updateDateTime();
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this._startInterval();
    }

    private _startInterval(): void {
        if (this._intervalId)
            return;

        this._intervalId = window.setInterval(this._updateDateTime.bind(this), this._interval);
    }

    private _stopInterval(): void {
        if (!this._intervalId)
            return;
        window.clearInterval(this._intervalId);
        this._intervalId = undefined;
    }

    private async _updateDateTime(): Promise<void> {
        const timeZone = this._config?.timeZone ?? this.hass?.config?.time_zone;
        const locale = this._config?.locale ?? this.hass?.locale?.language;

        let dateTime: DateTime = DateTime.local();
        /* if (!this._config?.useHATime) {
            dateTime = DateTime.local();
        } else {
            dateTime = DateTime.fromSeconds(await new Promise<number>((resolve) => {
                this.hass.connection.subscribeMessage(
                    (msg) => resolve(parseInt((msg as any).result, 10)),
                    {type: "render_template", template: '{{as_timestamp(now())}}'}
                );
            }));
        } */

        if (timeZone)
            dateTime = dateTime.setZone(timeZone);
        if (locale)
            dateTime = dateTime.setLocale(locale);

        let firstLine: string;
        let secondLine: string;
        const meridiem: string = dateTime.toFormat("a").toLowerCase();
        const seconds: string = dateTime.toFormat("ss");

        if (typeof this._config?.firstLineFormat === 'string')
            firstLine = dateTime.toFormat(this._config.firstLineFormat);
        else
            firstLine = dateTime.toLocaleString(this._config?.firstLineFormat ?? { hour: '2-digit', minute: '2-digit' });

        if (typeof this._config?.secondLineFormat === 'string')
            secondLine = dateTime.toFormat(this._config.secondLineFormat);
        else
            secondLine = dateTime.toLocaleString(this._config?.secondLineFormat ?? { weekday: 'short', day: '2-digit', month: 'short' });

        if (firstLine !== this._firstLine)
            this._firstLine = firstLine;
        if (meridiem !== this._meridiem)
            this._meridiem = meridiem;
        if (seconds !== this._seconds)
            this._seconds = seconds;
        if (secondLine !== this._secondLine)
            this._secondLine = secondLine;
    }

    public disconnectedCallback(): void {
        this._stopInterval();
        super.disconnectedCallback();
    }

    protected render(): TemplateResult | void {
        return html`
            <ha-card>
                <span class="first-line">${this._firstLine}<sup>${this._seconds}</sup> <span class="meridiem">${this._meridiem}</span></span>
                <span class="second-line">${this._secondLine}</span>
            </ha-card>
        `;
    }

    static get styles(): CSSResult {
        return css`
          ha-card {
            text-align: center;
            font-weight: 400;
            padding: 8px 0;
            font-size: 2em;
            line-height: 1.5em;
          }

          sup {
            font-size: 50%;
            line-height: 50%;
            color: var(--disabled-text-color);
          }

          ha-card > span {
            display: block;
            text-align: center;
          }

          .first-line {
            font-size: 5.5em;
            line-height: .7em;
            position: relative;
            top: 0em;
            text-align: center;
            left: 50%;
            transform: translateX(calc(-50% + .3em));
            display: table;
            margin: 0 auto;
          }

          .second-line {
            font-size: 1em;
            line-height: 1em;
            color: var(--disabled-text-color);
          }

          .meridiem {
            font-size: 50% !important;
            position: relative;
            top: 0em;
            left: -1.1em;
          }
        `;
    }
}
