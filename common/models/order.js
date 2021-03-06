var loopback = require('loopback');
module.exports = function(Order) {
	Order.validatesPresenceOf('billingAddress');
	Order.validatesPresenceOf('shippingAddress');
	Order.validatesPresenceOf('lineItems');
	Order.observe('after save', function(ctx, next){
		var app = Order.app;
		if(ctx.isNewInstance){
			
		}else{
			
		}
		next();
	});
	Order.m_placeOrder= function(userId, orders, cb) {
		var app = Order.app;
		var Email = app.models.Email;
		var User = app.models.User;
		var Customer = app.models.Customer;
		var HubUserMap = app.models.HubUserMap;
		var OrderStatus = app.models.OrderStatus;
		var LineItem = app.models.LineItem;
		var customerId;
		var validOrders = [];
		var validIds = [];
			//loopback.getCurrentContext().set("accessToken",accessToken);
			try{
				for(var i = 0;i<orders.length;i++){
					if(orders[i].lineItems && orders[i].lineItems.length > 0){
						validOrders.push(orders[i]);
						customerId = orders[i].customerId;
					}
				}
				var len = validOrders.length;
				var newOrders = [];
				OrderStatus.findOne({where:{name:'PO'}}).then(function (orderSt){
					for(var i=0;i<validOrders.length;i++){
						var tempOrder = validOrders[i];
						tempOrder.orderStatusId = orderSt.id;
						tempOrder.userId = userId;
						Order.create(tempOrder).then(function(newOrder){
							newOrders.push(newOrder);
							if(--len == 0){
								var allLineItems = [];
								newOrders.forEach(function(ex,j){
									validOrders[j].lineItems.forEach(function(ex1,j1){
										ex1.orderId = ex.id;
										ex1.deliveredQuantity = ex.lineItemQuantity;
										validIds.push(ex.id);
										ex1.custUpdatedDate = null;
										allLineItems.push(ex1);
									});
								});
								var lineItemsLength = allLineItems.length;
								var calls = [];
								allLineItems.forEach(function(ex,j){
										LineItem.create(ex).then(function(newLineItem){
											if(--lineItemsLength == 0){
												Order.find({ where: {id: {inq:validIds}},include:[{lineItems:'item'},'orderStatus','customer']}).then(function(data){
													cb(null,data);
												});
											}
										});
								});
								var mailList = [];
								Customer.findOne({where:{id:customerId}}).then(function (cust){
									HubUserMap.find({ where: {hubId: cust.hubId},include:[{user:'roles'}]}).then(function(usermaps){
										if(usermaps.length > 0){
											usermaps.forEach(function(usermap,itr){
												usermap = usermap.toJSON();
												if(usermap.user.roles.length>0){
													usermap.user.roles.forEach(function(role,jtr){
														if(role.name === 'HUBADMIN' || role.name === 'HUBOWNER'){
															mailList.push(usermap.user);
														}
													});
												}
											});
										}
										if(mailList.length > 0){
											mailList.forEach(function(person){
												var options = {
														to : person.email,
														subject : 'Order(s) Received',
														text : 'New Order',
														html : 'Hi '+person.firstname+', \n New order has been received from customer '+cust.name+'.' 
												}
												Email.sendCustomEmail(options);
											});
										}
									});
								});
								User.findOne({where:{id:userId}}).then(function (usr){
									var options = {
											to : usr.email,
											subject : 'Order(s) Received',
											text : 'New Order',
											html : 'Hi '+usr.firstname+', \n Thanks you for placing order with us. Your Order(s) received. We will notify you once we review and confirm your order.' 
									}
									Email.sendCustomEmail(options);
								});
							}
						});
					}
				});
			}catch(err){
				cb(err);
			}

	};
	Order.placeOrder= function(orders, cb) {
		var app = Order.app;
		var OrderStatus = app.models.OrderStatus;
		var LineItem = app.models.LineItem;
		var Email = app.models.Email;
		var Customer = app.models.Customer;
		var HubUserMap = app.models.HubUserMap;
		var User = app.models.User;
		var validOrders = [];
		var customerId;
		var validIds = [];
		var ctx = loopback.getCurrentContext();
		var accessToken = ctx.get('accessToken');
		if(accessToken == null || accessToken.userId == null){
			var err = new Error('Forbidden');
			err.statusCode = 403;
			cb(err);
		}else{
			var userId = accessToken.userId;
			//loopback.getCurrentContext().set("accessToken",accessToken);
			try{
				for(var i = 0;i<orders.length;i++){
					if(orders[i].lineItems && orders[i].lineItems.length > 0){
						validOrders.push(orders[i]);
						customerId = orders[i].customerId;
					}
				}
				var len = validOrders.length;
				var newOrders = [];
				OrderStatus.findOne({where:{name:'PO'}}).then(function (orderSt){
					for(var i=0;i<validOrders.length;i++){
						var tempOrder = validOrders[i];
						tempOrder.orderStatusId = orderSt.id;
						tempOrder.userId = accessToken.userId;
						Order.create(tempOrder).then(function(newOrder){
							newOrders.push(newOrder);
							if(--len == 0){
								var allLineItems = [];
								newOrders.forEach(function(ex,j){
									validOrders[j].lineItems.forEach(function(ex1,j1){
										ex1.orderId = ex.id;
										ex1.deliveredQuantity = ex.lineItemQuantity;
										validIds.push(ex.id);
										ex1.custUpdatedDate = null;
										allLineItems.push(ex1);
									});
								});
								var lineItemsLength = allLineItems.length;
								var calls = [];
								allLineItems.forEach(function(ex,j){
										LineItem.create(ex).then(function(newLineItem){
											if(--lineItemsLength == 0){
												Order.find({ where: {id: {inq:validIds}},include:[{lineItems:'item'},'orderStatus','customer']}).then(function(data){
													cb(null,data);
												});
											}
										});
								});
								var mailList = [];
								Customer.findOne({where:{id:customerId}}).then(function (cust){
									HubUserMap.find({ where: {hubId: cust.hubId},include:[{user:'roles'}]}).then(function(usermaps){
										if(usermaps.length > 0){
											usermaps.forEach(function(usermap,itr){
												usermap = usermap.toJSON();
												if(usermap.user.roles.length>0){
													usermap.user.roles.forEach(function(role,jtr){
														if(role.name === 'HUBADMIN' || role.name === 'HUBOWNER'){
															mailList.push(usermap.user);
														}
													});
												}
											});
										}
										if(mailList.length > 0){
											mailList.forEach(function(person){
												var options = {
														to : person.email,
														subject : 'Order(s) Received',
														text : 'New Order',
														html : 'Hi '+person.firstname+', \n New order has been received from customer '+cust.name+'.' 
												}
												Email.sendCustomEmail(options);
											});
										}
									});
								});
								User.findOne({where:{id:userId}}).then(function (usr){
									var options = {
											to : usr.email,
											subject : 'Order(s) Received',
											text : 'New Order',
											html : 'Hi '+usr.firstname+', \n Thanks you for placing order with us. Your Order(s) received. We will notify you once we review and confirm your order.' 
									}
									Email.sendCustomEmail(options);
								});
							}
						});
					}
				});
			}catch(err){
				cb(err);
			}
		}
	};
	Order.updateDC = function(dc,cb){
		var retValues = [];
		var app = Order.app;
		var OrderStatus = app.models.OrderStatus;
		var LineItem = app.models.LineItem;
		var lineItems = dc.lineItems;
		if(lineItems && lineItems.length > 0){
			var len = lineItems.length;
			for(var i = 0;i<lineItems.length;i++){
				/*LineItem.update({id:lineItems[i].id},{custUpdatedItemQuantity : lineItems[i].custUpdatedItemQuantity,
					custUpdatedDate : lineItems[i].custUpdatedDate},function(err,lineIt){
						if(err){
							cb(err);
						}
					});*/
				retValues.push(LineItem.update({id:lineItems[i].id},{custUpdatedItemQuantity : lineItems[i].custUpdatedItemQuantity,
					custUpdatedDate : lineItems[i].custUpdatedDate}));
				if(--len == 0){
					Q.all(retValues).then(function(data){
						OrderStatus.findOne({where:{name:'DELIVERED'}}).then(function (orderSt){
							Order.update({id:dc.id},{orderStatusId : orderSt.id}, function(err,ord){
								
							});
						});
					});
				}
			}
			cb(null,dc);
		}else{
			var err = new Error('Bad request');
			err.statusCode = 400;
			cb(err);
		}
	};
	Order.sendEmail = function(options,cb){
		var app = Order.app;
		var Email = app.models.Email;
		cb(null,"success");
		Email.sendCustomEmail(options);
	};
	Order.fullOrders = function(cb){
		Order.find({
			include:['orderStatus','customer',{lineItems:'item'}]
		},cb);
	};
	Order.remoteMethod(
        'placeOrder', 
        {
          accepts: {arg: 'orders', type: 'array'},
          returns: {arg: 'orders', type: 'array'},
          http: {path:'/placeOrder', verb: 'post'}
        }
    );
	Order.remoteMethod(
	        'updateDC', 
	        {
	          accepts: {arg: 'dc', type: 'object'},
	          returns: {arg: 'deliveryChallan', type: 'object'},
	          http: {path:'/updateDC', verb: 'put'}
	        }
	    );
	Order.remoteMethod(
			'fullOrders',
			{
				 returns: {arg: 'orders', type: 'array'},
		         http: {path:'/fullOrders', verb: 'get'}
			});
	Order.remoteMethod(
			'sendEmail',
			{
				 accepts: {arg: 'options', type: 'object'},
				 returns: {arg: 'status', type: 'string'},
		         http: {path:'/sendEmail', verb: 'post'}
			});
};