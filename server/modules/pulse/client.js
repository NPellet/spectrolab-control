
define( [ "getmodule-display/form2"], function( defaultModule ) {

	var module = function() { }

	module.prototype = new defaultModule();

	module.prototype.setExtraEvents = function() {

		var self = this;

		this.getInnerDom().on('click', '.timebase.dropdown-menu li', function() {
			var val = $( this ).children().html();
			$( this ).parent().parent().find('.timebase-selected').html( val );
			$( this ).parent().parent().find('.timebase-selected-input').prop( 'value', $( this ).data('val') );

			switch( $( this ).parent().parent().find('.timebase-selected-input').prop( 'name' ) ) {

				case 'timebase_pulse':
					self._change( 'pulse' );
				break;

				case 'timebase_period':
					self._change( 'period' );
				break;
			}
	
		});


		this.getInnerDom().on('change', '.pulse', function() {

			self._change( 'pulse', $( this ).prop( 'value' ) );
		});

		this.getInnerDom().on('change', '.duty', function() {

			self._change( 'duty', $( this ).prop( 'value' ) );
		});

		this.getInnerDom().on('change', '.period', function() {

			self._change( 'period', $( this ).prop( 'value' ) );
		});

		var self = this;
	}

	module.prototype._change = function( change ) {

		var self = this;
		var form = self.getFormData();
		var fixed = form.fixed;


		switch( fixed ) {


			case 'pulse':

				if( change == 'duty' ) {
					form.period = ( form.pulse * Math.pow( 10, form.timebase_pulse ) ) / ( form.duty / 100 ); 
					form.timebase_period = 0;
					
				}
				else {
					form.duty = ( form.pulse * Math.pow( 10, form.timebase_pulse ) ) / ( form.period * Math.pow( 10, form.timebase_period ) ) * 100;

					if( form.duty > 99 ) {
						form.duty = 99;
						form.period = ( form.pulse * Math.pow( 10, form.timebase_pulse ) ) / ( form.duty / 100 );
					}

				}

			break;

			case 'duty':

				if( change == 'period' ) {
					form.pulse = form.duty / 100 * ( form.period * Math.pow( 10, form.timebase_period ) ); 
					form.timebase_pulse = 0;

				} else {
					form.period = ( form.pulse * Math.pow( 10, form.timebase_pulse ) ) / ( form.duty / 100 );
					form.timebase_period = 0;
				}

			break;

			case 'period':

				if( change == 'duty' ) {
					form.pulse = form.duty / 100 * ( form.period * Math.pow( 10, form.timebase_period ) ); 
					form.timebase_pulse = 0;
				} else {
					form.duty = ( form.pulse * Math.pow( 10, form.timebase_pulse ) ) / ( form.period * Math.pow( 10, form.timebase_period ) ) * 100;


					if( form.duty > 99 ) {
						form.duty = 99;
						form.pulse = form.duty / 100 * ( form.period * Math.pow( 10, form.timebase_period ) ); 
					}

				}

			break;


		}

		
		var val = $( this ).prop('value');
		self._fixed = val;

		self.fill( form );
	

	}


	module.prototype.fill = function( data ) {

		//data.duty *= 100;

		if( data.pulse ) {
			var pulse = this.toScientific( data.pulse );
			data.pulse = Math.round( pulse[ 0 ] * 100 ) / 100;
			data['timebase_pulse'] -= -pulse[ 1 ];
			var txt = this.getInnerDom().find('.pulse-group .timebase li[data-val=' + ( data['timebase_pulse'] ) + ']').children().html();
			this.getInnerDom().find('.pulse-group .timebase').parent().find('.timebase-selected').html( txt );
			
		}

		if( data.period ) {
			var period = this.toScientific( data.period );
			data.period = Math.round( period[ 0 ] * 100 ) / 100;
			data['timebase_period'] -= -period[ 1 ];
			var txt = this.getInnerDom().find('.period-group .timebase li[data-val=' + ( data['timebase_period'] ) + ']').children().html();
			this.getInnerDom().find('.period-group .timebase').parent().find('.timebase-selected').html( txt );
	
		}

		this.populate( data );
	}

	module.prototype.toScientific = function( val ) {

		var exp = 0;

		while( val >= 1000 ) {
			val /= 1000;
			exp += 3;
		}

		while( val < 1 ) {
			val *= 1000;
			exp -= 3;
		}

		return [ val, exp ];
	}

	return module;

} );
