import axios from 'axios';
import findIndex from 'lodash/findIndex';
import minBy from 'lodash/minBy';

import { REGIONS } from 'constants/regions';

const pingTester = axios.create();

pingTester.interceptors.request.use(
  (config) => {
    const newConfig = { ...config };
    newConfig.metadata = { startTime: new Date() };
    return { ...newConfig };
  },
  (error) => {
    return Promise.reject(error);
  },
);

pingTester.interceptors.response.use(
  (response) => {
    const newRes = { ...response };
    newRes.config.metadata.endTime = new Date();
    newRes.duration = newRes.config.metadata.endTime - newRes.config.metadata.startTime;
    return newRes;
  },
  (error) => {
    const newError = { ...error };
    newError.config.metadata.endTime = new Date();
    newError.duration = newError.config.metadata.endTime - newError.config.metadata.startTime;
    return Promise.reject(newError);
  },
);

export function findClosestRegion() {
  const requests = REGIONS.map(({ AWSRegion }) =>
    pingTester.get(`https://ec2.${AWSRegion}.amazonaws.com/ping`),
  );

  return Promise.all(requests).then((responses) => {
    const minResponse = minBy(responses, ({ duration }) => duration);
    const minTimeResponseIndex = findIndex(responses, minResponse);
    return REGIONS[minTimeResponseIndex].key;
  });
}
