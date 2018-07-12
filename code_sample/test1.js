import _ from 'lodash/fp';
import {
	FETCH_API
} from '../actions';

function parseSwaggerData( data, result = [] ) {
	for ( const [ k,v ] of _.toPairs( data ) ) {
		if ( k === 'name' ) result.push( v );
		if ( _.isObject( v ) ) _.concat( result )( parseSwaggerData( v, result ) );
	}
	return result;
}

const dataReducer = ( state = {}, action ) => {

	switch ( action.type ) {
		case FETCH_API.BASE:
			{
				return {
					...state,
					swagger: action.payload.swagger
				};
			}
		case FETCH_API.SUCCESS:
			{
				return {
					...state,
					clazz: action.payload,
					selectedNS: { id: 0 },
					selectedTS: { id: 0 }
				};
			}
		default:
			{
				return state;
			}
	}
};

export default dataReducer;