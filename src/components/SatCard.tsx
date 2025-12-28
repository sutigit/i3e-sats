import { useEffect, useState } from "preact/hooks";
import { getVisibilityDisplay, type VisibilitySatus } from '../utils/visibilityHelpers';
import type { Satellite } from "../types"
import { Measure } from "./common/Measure";

export const SatPrimary = ({
    focus,
    setFocus,
    satellite
}: {
    focus: boolean;
    setFocus: () => void;
    satellite: Satellite;
}) => {
    const [timeToVisible, setTimeToVisible] = useState<VisibilitySatus["minutes"]>(0.0);
    const [visibleTime, setVisibleTime] = useState<string>('');

    useEffect(() => {
        if (!satellite) return;

        const { minutes, windowStr } = getVisibilityDisplay(satellite);

        setTimeToVisible(minutes);
        setVisibleTime(windowStr);

    }, [satellite]);

    return (
        <div
            className={`sat-primary ${focus ? 'focus' : ''}`}
            onClick={setFocus}
        >
            <p className="name">{satellite.name}</p>
            <Measure
                label="Time to visible"
                value={timeToVisible}
                unit={typeof timeToVisible === 'number' ? "min" : ""}
                highlight={timeToVisible === 'Visible'}
            />
            <Measure
                label="Visible time"
                value={visibleTime}
            />
        </div>
    );
};

export const SatSecondary = ({
    focus,
    setFocus,
    satellite
}: {
    focus: boolean;
    setFocus: () => void;
    satellite: Satellite;
}) => {
    const [timeToVisible, setTimeToVisible] = useState<number | string>(0.0);

    useEffect(() => {
        if (!satellite) return;

        const { minutes } = getVisibilityDisplay(satellite);
        setTimeToVisible(minutes);

    }, [satellite]);

    return (
        <div
            className={`sat-secondary ${focus ? 'focus' : ''}`}
            onClick={setFocus}
        >
            <p className="name">{satellite.name}</p>
            <Measure
                value={timeToVisible}
                unit={typeof timeToVisible === 'number' ? "min" : ""}
                variant="minified"
                highlight={timeToVisible === 'Visible'}
            />
        </div>
    );
};