export type AnalysisData = {
	config?: object,
	name: string,
}

export class Analysis implements AnalysisData {
	config?: object;
	name: string;

	constructor (
		data: AnalysisData,
	) {
		this.name = data.name;
		if (data.config)
			this.config = data.config;
	}
}