/*global app, jasmine, describe, it, beforeEach, expect */

describe('controller', function () {
	'use strict';

	var subject, model, view;

	var setUpModel = function (todos) {
		model.read.and.callFake(function (query, callback) {
			callback = callback || query;
			callback(todos);
		});

		model.getCount.and.callFake(function (callback) {

			var todoCounts = {
				active: todos.filter(function (todo) {
					return !todo.completed;
				}).length,
				completed: todos.filter(function (todo) {
					return !!todo.completed;
				}).length,
				total: todos.length
			};

			callback(todoCounts);
		});

		model.remove.and.callFake(function (id, callback) {
			callback();
		});

		model.create.and.callFake(function (title, callback) {
			callback();
		});

		model.update.and.callFake(function (id, updateData, callback) {
			callback();
		});
	};

	var createViewStub = function () {
		var eventRegistry = {};
		return {
			render: jasmine.createSpy('render'),
			bind: function (event, handler) {
				eventRegistry[event] = handler;
			},
			trigger: function (event, parameter) {
				eventRegistry[event](parameter);
			}
		};
	};

	beforeEach(function () {
		model = jasmine.createSpyObj('model', ['read', 'getCount', 'remove', 'create', 'update']);
		view = createViewStub();
		subject = new app.Controller(model, view);
	});

	it('should show entries on start-up', function () {
		// arrange : set a start state
		var todo = {title: 'my todo'};
		expect(todo).toBeDefined();
		setUpModel([todo]); 
		// action : filtering based on active page when we start-up (no hash)
		subject.setView('');
		// assert : view.render have been called with this
		expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		expect(view.render).toHaveBeenCalledWith('setFilter', '');
	});

	describe('routing', function () {

		it('should show all entries without a route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show all entries without "all" route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('#/');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show active entries', function () {

		// arrange : Set a todo with "completed" prop as false 
			var todo = {title: 'todo', completed: false};
			setUpModel([todo]);

		// action : todo filtering based on the route (hash : #/active)
			subject.setView('#/active');

		// assert : view.render have been called with this arguments
			expect(todo).toBeDefined(); 
			expect(todo.completed).toEqual(false); 
			expect(model.read).toHaveBeenCalledWith({completed: false}, jasmine.any(Function)); 
			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
			expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
		});

		it('should show completed entries', function () {

		// arrange : Set a todo with "completed" prop as false 
			var todo = {title: 'todo', completed: true};
			setUpModel([todo]);

		// action : todo filtering based on the route (hash : #/completed)
			subject.setView('#/completed');

		// assert : view.render have been called with this arguments
			expect(todo).toBeDefined(); 
			expect(todo.completed).toEqual(true); 
			expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function)); 
			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
			expect(view.render).toHaveBeenCalledWith('setFilter', 'completed');
		});
	});

	it('should show the content block when todos exists', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: true
		});
	});

	it('should hide the content block when no todos exists', function () {
		setUpModel([]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: false
		});
	});

	it('should check the toggle all button, if all todos are completed', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('toggleAll', {
			checked: true
		});
	});

	it('should set the "clear completed" button', function () {
		var todo = {id: 42, title: 'my todo', completed: true};
		setUpModel([todo]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
			completed: 1,
			visible: true
		});
	});

	it('should highlight "All" filter by default', function () {

		// arrange : for any model
		var todo = {title: 'todo', completed: true};
		setUpModel([todo]);
		// action : in default case 
		subject.setView('');
		// assert : render method is should be called with the '' parameter for 2nd argument 
		expect(todo).toBeDefined();
		expect(view.render).toHaveBeenCalledWith('setFilter', '');

	});

	it('should highlight "Active" filter when switching to active view', function () {

	// arrange : for model with an active enterie 
		var todo = {title: 'todo', completed: false};
		setUpModel([todo]);
	// action : in case we have switching to the active view
		subject.setView('#/active');
	// assert : render method is should be called with the 'active' parameter  
		expect(todo).toBeDefined();
		expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
	});

	describe('toggle all', function () {
		it('should toggle all todos to completed', function () {

		// arrange : for a model with several active todo		
			var todos = [
				{id: 42, title: 'todoOne', completed: false},
				{id: 43, title: 'todoTwo', completed: false}
			]
			setUpModel(todos);
		// action : 'toggleAll' (a viewCmd) which assign for all checked value, the checked value of the parameter (2nd argument)
			subject.setView('');
			view.trigger('toggleAll', {completed: true});
		// assert : update method should be called for all with the {completed: true} parameter 
			expect(todos).toBeDefined();
			expect(model.update).toHaveBeenCalledWith(42, {completed: true}, jasmine.any(Function));
			expect(model.update).toHaveBeenCalledWith(43, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {

		// arrange : set as previously for testing the update view
		var todos = [
			{id: 42, title: 'todoOne', completed: false},
			{id: 43, title: 'todoTwo', completed: false}
		]
		setUpModel(todos);
		// action : run the view with update model
			subject.setView('');
		// assert : render method should be called with a viewCmd and his parameter who set the new content (the update view)
			expect(view.render).toHaveBeenCalledWith('updateElementCount', 2);
		});
	});

	describe('new todo', function () {
		it('should add a new todo to the model', function () {
			// TODO: write test
			setUpModel([]);

			subject.setView('');
			view.trigger('newTodo', 'my new todo');

			expect(model.create).toHaveBeenCalledWith('my new todo', jasmine.any(Function));
		});

		it('should add a new todo to the view', function () {
			setUpModel([]);

			subject.setView('');

			view.render.calls.reset();
			model.read.calls.reset();
			model.read.and.callFake(function (callback) {
				callback([{
					title: 'a new todo',
					completed: false
				}]);
			});

			view.trigger('newTodo', 'a new todo');

			expect(model.read).toHaveBeenCalled();

			expect(view.render).toHaveBeenCalledWith('showEntries', [{
				title: 'a new todo',
				completed: false
			}]);
		});

		it('should clear the input field when a new todo is added', function () {
			setUpModel([]);

			subject.setView('');

			view.trigger('newTodo', 'a new todo');

			expect(view.render).toHaveBeenCalledWith('clearNewTodo');
		});
	});

	describe('element removal', function () {
		it('should remove an entry from the model', function () {
			// TODO: write test
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(todo).toBeDefined();
			expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
		});

		it('should remove an entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});

		it('should update the element count', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('updateElementCount', 0);
		});
	});

	describe('remove completed', function () {
		it('should remove a completed entry from the model', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function));
			expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
		});

		it('should remove a completed entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});
	});

	describe('element complete toggle', function () {
		it('should update the model', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 21, completed: true});

			expect(model.update).toHaveBeenCalledWith(21, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 42, completed: false});

			expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 42, completed: false});
		});
	});

	describe('edit item', function () {
		it('should switch to edit mode', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEdit', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItem', {id: 21, title: 'my todo'});
		});

		it('should leave edit mode on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'new title'});
		});

		it('should persist the changes on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(model.update).toHaveBeenCalledWith(21, {title: 'new title'}, jasmine.any(Function));
		});

		it('should remove the element from the model when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(model.remove).toHaveBeenCalledWith(21, jasmine.any(Function));
		});

		it('should remove the element from the view when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(view.render).toHaveBeenCalledWith('removeItem', 21);
		});

		it('should leave edit mode on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'my todo'});
		});

		it('should not persist the changes on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(model.update).not.toHaveBeenCalled();
		});
	});
});
