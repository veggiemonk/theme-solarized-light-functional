import _ from 'lodash/fp';
import { takeLatest } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { send } from '../proxy';
import { FETCH_API, fetchApi } from '../redux/actions';
//---------------------------------------------------------
// SWAGGER

export function * genGetDataFromSwagger( action ) {
	try {
		const data = yield call( send, action.payload );
		if ( data.error ) yield put( fetchApi.error( data ) );
		else if ( _.isArray( data.apis ) ){
			// parse data from SWAGGER to get parameters of the request
			const clazz = _.reduce(
				( acc, val ) => _.has( 'enum' )( val ) ? val.enum : '', [] )( data.apis[0].operations[0].parameters );
			yield put( fetchApi.success( clazz ) );
		} else {
			yield put( fetchApi.error( data ) );
		}
	} catch ( e ) {
		yield put( fetchApi.error( e.message ) );
	}
}

export function * serviceGetDataFromSwagger() {
	yield * takeLatest( FETCH_API.REQUEST, genGetDataFromSwagger );
}